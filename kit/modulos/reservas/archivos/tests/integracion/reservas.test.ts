/**
 * Pruebas de integración contra una base de datos MySQL/MariaDB REAL (la de .env.test).
 * ¡Borra y recrea las tablas! Nunca apuntes DATABASE_URL de .env.test a producción.
 */
import { existsSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { crearBaseDeDatos, type BaseDeDatos } from '../../src/lib/db/conexion';
import type { Correo } from '../../src/lib/reservas/correo';
import { buscarReserva, eventosDe, ocupacionDelDia } from '../../src/lib/reservas/repositorio';
import {
  cancelarPorEnlace,
  confirmarReserva,
  crearReservaManual,
  mantenimientoDiario,
  rechazarReserva,
  solicitarReserva,
  type Dependencias,
} from '../../src/lib/reservas/servicio';
import type { ConfigReservas } from '../../src/lib/reservas/tipos';
import { crearTokenFormulario } from '../../src/lib/seguridad/tokens';
import type { Solicitud } from '../../src/lib/reservas/validacion';

if (existsSync('.env.test')) process.loadEnvFile('.env.test');
const URL_BD = process.env.DATABASE_URL;
if (URL_BD && !/test|prueba/i.test(URL_BD)) {
  throw new Error('Por seguridad, la base de datos de pruebas debe llamarse *test* o *prueba*.');
}

const SECRETO = 's'.repeat(40);
const config: ConfigReservas = {
  configurado: true,
  zonaHoraria: 'Europe/Madrid',
  servicios: [
    {
      id: 'comida',
      nombre: 'Comida',
      dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      primeraLlegada: '13:00',
      ultimaLlegada: '15:00',
      intervaloMinutos: 30,
      aforo: 20,
    },
  ],
  personas: { min: 1, maxOnline: 8 },
  antelacion: { minMinutos: 60, maxDias: 60 },
  cierres: [],
  textoGrupos: '',
  conservacionDias: 90,
};
const FECHA = '2030-03-15';
const ahora = () => ({ fecha: '2030-03-10', hora: '10:00' });

describe.skipIf(!URL_BD)('reservas contra base de datos real', () => {
  let db: BaseDeDatos;
  let cerrar: () => Promise<void>;
  let correos: Correo[] = [];
  let d: Dependencias;

  const solicitud = (cambios: Partial<Solicitud> = {}): Solicitud => ({
    fecha: FECHA,
    hora: '13:30',
    personas: 2,
    nombre: 'Ana Prueba',
    email: 'ana@example.com',
    telefono: '600111222',
    comentarios: '',
    acepto: true,
    web: '',
    t: crearTokenFormulario(SECRETO, Date.now() - 10_000),
    ...cambios,
  });

  const enlaceCancelar = (c: Correo) => new URL(/https?:\/\/\S+cancelar\S+/.exec(c.texto)![0]);

  beforeAll(async () => {
    ({ db, cerrar } = crearBaseDeDatos(URL_BD!));
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    for (const tabla of ['reservas_eventos', 'reservas', 'ajustes', '__drizzle_migrations']) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${tabla}\``));
    }
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    await migrate(db, { migrationsFolder: './drizzle' });
    d = {
      db,
      enviar: async (c) => {
        correos.push(c);
      },
      config,
      restaurante: { nombre: 'Restaurante de prueba', telefono: '952000000' },
      urlBase: 'http://localhost:4321',
      emailAvisos: 'sala@example.com',
      secreto: SECRETO,
      ahora,
    };
  });

  beforeEach(async () => {
    correos = [];
    await db.execute(sql`DELETE FROM reservas`);
    await db.execute(sql`DELETE FROM ajustes`);
  });

  afterAll(async () => {
    await cerrar?.();
  });

  it('crea una solicitud pendiente y avisa al cliente y al restaurante', async () => {
    const r = await solicitarReserva(d, solicitud());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.valor).toMatchObject({ estado: 'pendiente', servicio: 'comida', personas: 2, origen: 'web' });
    expect(r.valor.consentimientoEn).toBeInstanceOf(Date);
    expect(correos.map((c) => c.para).sort()).toEqual(['ana@example.com', 'sala@example.com']);
    expect((await eventosDe(db, [r.valor.id])).map((e) => e.accion)).toEqual(['creada', 'correo', 'correo']);
  });

  it('nunca supera el aforo aunque lleguen solicitudes a la vez', async () => {
    const intentos = await Promise.all(
      Array.from({ length: 14 }, (_, i) => solicitarReserva(d, solicitud({ email: `c${i}@example.com`, personas: 2 }))),
    );
    const aceptadas = intentos.filter((r) => r.ok).length;
    expect(aceptadas).toBe(10);
    const ocupacion = await ocupacionDelDia(db, FECHA);
    expect(ocupacion.reduce((t, o) => t + o.personas, 0)).toBe(20);
    expect(intentos.filter((r) => !r.ok).every((r) => !r.ok && r.estado === 409)).toBe(true);
  });

  it('impide solicitudes duplicadas del mismo email para el mismo servicio', async () => {
    expect((await solicitarReserva(d, solicitud())).ok).toBe(true);
    const repetida = await solicitarReserva(d, solicitud({ hora: '14:00' }));
    expect(repetida).toMatchObject({ ok: false, estado: 409 });
  });

  it('rechaza tokens enviados al instante o falsificados', async () => {
    const rapida = await solicitarReserva(d, solicitud({ t: crearTokenFormulario(SECRETO) }));
    expect(rapida).toMatchObject({ ok: false, estado: 400 });
    const falsa = await solicitarReserva(d, solicitud({ t: crearTokenFormulario('otro'.repeat(10), Date.now() - 10_000) }));
    expect(falsa).toMatchObject({ ok: false, estado: 400 });
  });

  it('confirma y luego el cliente cancela con el enlace nuevo; el enlace antiguo deja de valer', async () => {
    const r = await solicitarReserva(d, solicitud());
    if (!r.ok) throw new Error(r.mensaje);
    const enlaceInicial = enlaceCancelar(correos[0]!);

    correos = [];
    const confirmada = await confirmarReserva(d, r.valor.id);
    expect(confirmada).toMatchObject({ ok: true, valor: { estado: 'confirmada' } });
    expect(correos[0]?.asunto).toMatch(/confirmada/i);
    const enlaceNuevo = enlaceCancelar(correos[0]!);

    const conAntiguo = await cancelarPorEnlace(d, enlaceInicial.searchParams.get('c')!, enlaceInicial.searchParams.get('t')!);
    expect(conAntiguo.ok).toBe(false);

    const cancelada = await cancelarPorEnlace(d, enlaceNuevo.searchParams.get('c')!, enlaceNuevo.searchParams.get('t')!);
    expect(cancelada).toMatchObject({ ok: true, valor: { estado: 'cancelada', tokenCancelacion: null } });
    expect((await ocupacionDelDia(db, FECHA)).length).toBe(0);
  });

  it('no permite transiciones inválidas', async () => {
    const r = await solicitarReserva(d, solicitud());
    if (!r.ok) throw new Error(r.mensaje);
    expect((await rechazarReserva(d, r.valor.id, 'Completo por un evento')).ok).toBe(true);
    expect(correos.at(-1)?.texto).toContain('Completo por un evento');
    expect((await confirmarReserva(d, r.valor.id)).ok).toBe(false);
  });

  it('las reservas telefónicas cuentan para el aforo y solo lo superan si se fuerza', async () => {
    const base = { fecha: FECHA, hora: '14:00', nombre: 'Mesa larga', email: '', telefono: '', comentarios: '', estado: 'confirmada' as const };
    expect((await crearReservaManual(d, { ...base, personas: 18, forzar: false })).ok).toBe(true);
    expect(await crearReservaManual(d, { ...base, personas: 4, forzar: false })).toMatchObject({ ok: false, estado: 409 });
    expect((await crearReservaManual(d, { ...base, personas: 4, forzar: true })).ok).toBe(true);
    const web = await solicitarReserva(d, solicitud());
    expect(web).toMatchObject({ ok: false, estado: 409 });
  });

  it('anonimiza los datos personales pasado el plazo de conservación', async () => {
    const r = await solicitarReserva(d, solicitud());
    if (!r.ok) throw new Error(r.mensaje);
    const despues = { ...d, ahora: () => ({ fecha: '2030-07-01', hora: '10:00' }) };
    expect(await mantenimientoDiario(despues)).toBe(1);
    expect(await mantenimientoDiario(despues)).toBe(0);
    const anonima = await buscarReserva(db, r.valor.id);
    expect(anonima).toMatchObject({ nombre: '—', email: null, telefono: null, personas: 2 });
  });
});
