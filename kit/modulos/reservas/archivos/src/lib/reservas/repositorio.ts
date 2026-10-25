/**
 * Acceso a datos de reservas. Todas las consultas son parametrizadas (Drizzle).
 * Recibe la conexión como parámetro para poder probarse contra una base de datos real.
 */
import { and, asc, eq, gte, inArray, isNull, lte, lt, sql } from 'drizzle-orm';
import type { BaseDeDatos } from '../db/conexion';
import { ajustes, eventosReserva, reservas, type Reserva } from '../db/esquema';
import { codigoReserva } from '../seguridad/tokens';
import type { EstadoReserva, Ocupacion, OrigenReserva } from './tipos';

export const ESTADOS_ACTIVOS: EstadoReserva[] = ['pendiente', 'confirmada'];

const TRANSICIONES: Record<EstadoReserva, EstadoReserva[]> = {
  pendiente: ['confirmada', 'rechazada', 'cancelada'],
  confirmada: ['cancelada'],
  rechazada: [],
  cancelada: [],
};

type Ejecutor = Pick<BaseDeDatos, 'select' | 'insert' | 'update'>;

export async function ocupacionDelDia(db: Ejecutor, fecha: string): Promise<Ocupacion[]> {
  const filas = await db
    .select({
      servicio: reservas.servicio,
      hora: reservas.hora,
      personas: sql<string>`SUM(${reservas.personas})`,
    })
    .from(reservas)
    .where(and(eq(reservas.fecha, fecha), inArray(reservas.estado, ESTADOS_ACTIVOS)))
    .groupBy(reservas.servicio, reservas.hora);
  return filas.map((f) => ({ servicio: f.servicio, hora: f.hora, personas: Number(f.personas) }));
}

export interface DatosNuevaReserva {
  fecha: string;
  hora: string;
  servicio: string;
  personas: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  comentarios: string;
  estado: EstadoReserva;
  origen: OrigenReserva;
  tokenCancelacion: string | null;
  consentimiento: boolean;
}

export type ResultadoCreacion<E extends string> =
  | { ok: true; reserva: Reserva }
  | { ok: false; motivo: E | 'duplicada' };

/**
 * Crea una reserva comprobando aforo de forma atómica: un bloqueo con nombre por fecha
 * impide que dos solicitudes simultáneas superen el aforo.
 */
export async function crearReservaAtomica<E extends string>(
  db: BaseDeDatos,
  datos: DatosNuevaReserva,
  /** Se ejecuta dentro del bloqueo con la ocupación real; puede fijar el servicio resultante. */
  comprobar: (ocupacion: Ocupacion[]) => { ok: true; servicio?: string } | { ok: false; motivo: E },
): Promise<ResultadoCreacion<E>> {
  const bloqueo = `trixel_reservas_${datos.fecha}`;
  return db.transaction(async (tx) => {
    const [filas] = (await tx.execute(sql`SELECT GET_LOCK(${bloqueo}, 10) AS ok`)) as unknown as [
      Array<{ ok: number | null }>,
    ];
    if (filas[0]?.ok !== 1) throw new Error('No se pudo obtener el bloqueo de reservas');
    try {
      const comprobacion = comprobar(await ocupacionDelDia(tx, datos.fecha));
      if (!comprobacion.ok) return { ok: false as const, motivo: comprobacion.motivo };
      const servicio = comprobacion.servicio ?? datos.servicio;

      if (datos.email) {
        const repetida = await tx
          .select({ id: reservas.id })
          .from(reservas)
          .where(
            and(
              eq(reservas.email, datos.email),
              eq(reservas.fecha, datos.fecha),
              eq(reservas.servicio, servicio),
              inArray(reservas.estado, ESTADOS_ACTIVOS),
            ),
          )
          .limit(1);
        if (repetida.length > 0) return { ok: false as const, motivo: 'duplicada' as const };
      }

      const ahora = new Date();
      let codigo = codigoReserva();
      for (let i = 0; i < 5; i++) {
        const existe = await tx.select({ id: reservas.id }).from(reservas).where(eq(reservas.codigo, codigo)).limit(1);
        if (existe.length === 0) break;
        codigo = codigoReserva();
      }
      const [insercion] = await tx.insert(reservas).values({
        codigo,
        fecha: datos.fecha,
        hora: datos.hora,
        servicio,
        personas: datos.personas,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        comentarios: datos.comentarios,
        estado: datos.estado,
        origen: datos.origen,
        tokenCancelacion: datos.tokenCancelacion,
        consentimientoEn: datos.consentimiento ? ahora : null,
        creadaEn: ahora,
        actualizadaEn: ahora,
      });
      const id = insercion.insertId;
      await tx.insert(eventosReserva).values({
        reservaId: id,
        accion: 'creada',
        detalle: `${datos.origen} · ${datos.estado}`,
        creadoEn: ahora,
      });
      const [reserva] = await tx.select().from(reservas).where(eq(reservas.id, id));
      return { ok: true as const, reserva: reserva! };
    } finally {
      await tx.execute(sql`SELECT RELEASE_LOCK(${bloqueo})`);
    }
  });
}

export async function buscarReserva(db: BaseDeDatos, id: number): Promise<Reserva | undefined> {
  const [r] = await db.select().from(reservas).where(eq(reservas.id, id));
  return r;
}

export async function buscarPorCodigo(db: BaseDeDatos, codigo: string): Promise<Reserva | undefined> {
  const [r] = await db.select().from(reservas).where(eq(reservas.codigo, codigo.toUpperCase()));
  return r;
}

export async function listarReservas(
  db: BaseDeDatos,
  filtro: { desde: string; hasta: string; estados?: EstadoReserva[] },
): Promise<Reserva[]> {
  const condiciones = [gte(reservas.fecha, filtro.desde), lte(reservas.fecha, filtro.hasta)];
  if (filtro.estados?.length) condiciones.push(inArray(reservas.estado, filtro.estados));
  return db
    .select()
    .from(reservas)
    .where(and(...condiciones))
    .orderBy(asc(reservas.fecha), asc(reservas.hora), asc(reservas.id));
}

export async function contarPendientes(db: BaseDeDatos, desde: string): Promise<number> {
  const [fila] = await db
    .select({ n: sql<string>`COUNT(*)` })
    .from(reservas)
    .where(and(eq(reservas.estado, 'pendiente'), gte(reservas.fecha, desde)));
  return Number(fila?.n ?? 0);
}

export async function eventosDe(db: BaseDeDatos, reservaIds: number[]) {
  if (reservaIds.length === 0) return [];
  return db
    .select()
    .from(eventosReserva)
    .where(inArray(eventosReserva.reservaId, reservaIds))
    .orderBy(asc(eventosReserva.id));
}

export async function registrarEvento(db: Ejecutor, reservaId: number, accion: string, detalle = '') {
  await db.insert(eventosReserva).values({ reservaId, accion, detalle: detalle.slice(0, 600), creadoEn: new Date() });
}

export function transicionPermitida(desde: EstadoReserva, hacia: EstadoReserva): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

/** Cambia el estado si la transición es válida. Devuelve la reserva actualizada o null. */
export async function cambiarEstado(
  db: BaseDeDatos,
  id: number,
  hacia: EstadoReserva,
  detalle = '',
): Promise<Reserva | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(reservas).where(eq(reservas.id, id)).for('update');
    if (!actual || !transicionPermitida(actual.estado, hacia)) return null;
    await tx
      .update(reservas)
      .set({
        estado: hacia,
        actualizadaEn: new Date(),
        // Tras cancelar o rechazar, el enlace de cancelación deja de servir.
        ...(hacia === 'cancelada' || hacia === 'rechazada' ? { tokenCancelacion: null } : {}),
      })
      .where(eq(reservas.id, id));
    await registrarEvento(tx, id, hacia, detalle);
    const [r] = await tx.select().from(reservas).where(eq(reservas.id, id));
    return r ?? null;
  });
}

/**
 * Anonimiza los datos personales de reservas cuya fecha es anterior a `antesDe`
 * (minimización y limitación del plazo de conservación, RGPD art. 5).
 */
export async function anonimizarAntiguas(db: BaseDeDatos, antesDe: string): Promise<number> {
  const [resultado] = await db
    .update(reservas)
    .set({
      nombre: '—',
      email: null,
      telefono: null,
      comentarios: '',
      tokenCancelacion: null,
      anonimizadaEn: new Date(),
    })
    .where(and(lt(reservas.fecha, antesDe), isNull(reservas.anonimizadaEn)));
  return resultado.affectedRows;
}

export async function cambiarTokenCancelacion(db: BaseDeDatos, id: number, hash: string | null) {
  await db.update(reservas).set({ tokenCancelacion: hash }).where(eq(reservas.id, id));
}

export async function leerAjuste(db: BaseDeDatos, clave: string): Promise<string | undefined> {
  const [fila] = await db.select().from(ajustes).where(eq(ajustes.clave, clave));
  return fila?.valor;
}

export async function guardarAjuste(db: BaseDeDatos, clave: string, valor: string) {
  await db.insert(ajustes).values({ clave, valor }).onDuplicateKeyUpdate({ set: { valor } });
}
