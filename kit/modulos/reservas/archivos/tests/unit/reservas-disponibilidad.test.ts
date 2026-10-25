import { describe, expect, it } from 'vitest';
import {
  cabe,
  comprobarFranja,
  disponibilidadDelDia,
  horasDeServicio,
  servicioDeHora,
} from '../../src/lib/reservas/disponibilidad';
import { ahoraEn, diaSemana, esFechaValida, sumarDias } from '../../src/lib/reservas/fechas';
import type { ConfigReservas } from '../../src/lib/reservas/tipos';

const config: ConfigReservas = {
  configurado: true,
  zonaHoraria: 'Europe/Madrid',
  servicios: [
    {
      id: 'comida',
      nombre: 'Comida',
      dias: ['martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      primeraLlegada: '13:00',
      ultimaLlegada: '15:00',
      intervaloMinutos: 30,
      aforo: 20,
    },
    {
      id: 'cena',
      nombre: 'Cena',
      dias: ['viernes', 'sabado'],
      primeraLlegada: '20:30',
      ultimaLlegada: '22:00',
      intervaloMinutos: 30,
      aforo: 20,
      aforoPorFranja: 8,
    },
  ],
  personas: { min: 1, maxOnline: 8 },
  antelacion: { minMinutos: 120, maxDias: 30 },
  cierres: [{ desde: '2026-12-24', hasta: '2026-12-26', motivo: 'Navidad' }],
  textoGrupos: 'Llámanos',
  conservacionDias: 90,
};

// Viernes 13 de noviembre de 2026, 10:00 en Madrid.
const ahora = { fecha: '2026-11-13', hora: '10:00' };

describe('fechas', () => {
  it('valida fechas reales', () => {
    expect(esFechaValida('2026-02-29')).toBe(false);
    expect(esFechaValida('2028-02-29')).toBe(true);
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('13/11/2026')).toBe(false);
  });
  it('calcula el día de la semana sin depender de la zona horaria del servidor', () => {
    expect(diaSemana('2026-11-13')).toBe('viernes');
    expect(diaSemana('2026-11-16')).toBe('lunes');
  });
  it('suma días cruzando meses y el cambio de hora', () => {
    expect(sumarDias('2026-10-24', 2)).toBe('2026-10-26');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('obtiene la hora local de Madrid', () => {
    expect(ahoraEn('Europe/Madrid', new Date('2026-07-01T10:00:00Z'))).toEqual({ fecha: '2026-07-01', hora: '12:00' });
    expect(ahoraEn('Europe/Madrid', new Date('2026-12-31T23:30:00Z'))).toEqual({ fecha: '2027-01-01', hora: '00:30' });
  });
});

describe('disponibilidad', () => {
  it('genera las horas de llegada de un servicio', () => {
    expect(horasDeServicio(config.servicios[1]!)).toEqual(['20:30', '21:00', '21:30', '22:00']);
  });

  it('ofrece comida y cena un viernes', () => {
    const r = disponibilidadDelDia(config, '2026-11-13', 2, [], ahora);
    expect(r.motivo).toBeUndefined();
    expect(r.franjas.map((f) => f.hora)).toEqual(['13:00', '13:30', '14:00', '14:30', '15:00', '20:30', '21:00', '21:30', '22:00']);
    expect(r.franjas.every((f) => f.disponible)).toBe(true);
  });

  it('respeta la antelación mínima', () => {
    const r = disponibilidadDelDia(config, '2026-11-13', 2, [], { fecha: '2026-11-13', hora: '12:15' });
    expect(r.franjas[0]?.hora).toBe('14:30');
  });

  it('no abre los lunes', () => {
    expect(disponibilidadDelDia(config, '2026-11-16', 2, [], ahora).motivo).toBe('sin_servicio');
  });

  it('respeta los cierres con su motivo', () => {
    const r = disponibilidadDelDia(config, '2026-12-25', 2, [], { fecha: '2026-12-01', hora: '10:00' });
    expect(r).toMatchObject({ motivo: 'cerrado', detalle: 'Navidad' });
  });

  it('rechaza fechas pasadas, fuera de plazo y grupos grandes', () => {
    expect(disponibilidadDelDia(config, '2026-11-12', 2, [], ahora).motivo).toBe('fecha_pasada');
    expect(disponibilidadDelDia(config, '2026-12-20', 2, [], ahora).motivo).toBe('fuera_de_plazo');
    expect(disponibilidadDelDia(config, '2026-11-13', 9, [], ahora).motivo).toBe('personas_fuera_de_rango');
  });

  it('marca como no disponible cuando el aforo del servicio está lleno', () => {
    const ocupacion = [{ servicio: 'comida', hora: '13:00', personas: 19 }];
    const r = disponibilidadDelDia(config, '2026-11-13', 2, ocupacion, ahora);
    expect(r.franjas.filter((f) => f.servicio === 'comida').every((f) => !f.disponible)).toBe(true);
    expect(r.franjas.filter((f) => f.servicio === 'cena').every((f) => f.disponible)).toBe(true);
    expect(disponibilidadDelDia(config, '2026-11-13', 1, ocupacion, ahora).franjas[0]?.disponible).toBe(true);
  });

  it('aplica el aforo por franja', () => {
    const cena = config.servicios[1]!;
    const ocupacion = [{ servicio: 'cena', hora: '21:00', personas: 6 }];
    expect(cabe(cena, '21:00', 3, ocupacion)).toBe(false);
    expect(cabe(cena, '21:00', 2, ocupacion)).toBe(true);
    expect(cabe(cena, '21:30', 3, ocupacion)).toBe(true);
  });

  it('comprueba una franja concreta antes de guardar', () => {
    expect(comprobarFranja(config, '2026-11-13', '13:15', 2, [], ahora)).toEqual({ ok: false, motivo: 'hora_no_ofrecida' });
    expect(comprobarFranja(config, '2026-11-13', '21:00', 2, [], ahora)).toMatchObject({ ok: true });
    expect(
      comprobarFranja(config, '2026-11-13', '21:00', 4, [{ servicio: 'cena', hora: '20:30', personas: 17 }], ahora),
    ).toEqual({ ok: false, motivo: 'completo' });
  });

  it('encuentra el servicio de una hora', () => {
    expect(servicioDeHora(config, '2026-11-13', '21:30')?.id).toBe('cena');
    expect(servicioDeHora(config, '2026-11-17', '21:30')).toBeUndefined();
  });
});
