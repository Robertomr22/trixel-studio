/**
 * Lógica pura de disponibilidad: sin base de datos ni red, totalmente testeable.
 * La disponibilidad sale de la configuración del restaurante y de la ocupación REAL
 * leída de la base de datos; nunca de datos estáticos.
 */
import { aMinutos, deMinutos, diaSemana, esFechaValida, marcaLocal, sumarDias, type AhoraLocal } from './fechas';
import type { ConfigReservas, Franja, MotivoNoDisponible, Ocupacion, Servicio } from './tipos';

export interface ResultadoDia {
  franjas: Franja[];
  motivo?: MotivoNoDisponible;
  /** Texto del cierre (p. ej. "Vacaciones") cuando motivo = 'cerrado'. */
  detalle?: string;
}

/** Horas de llegada que ofrece un servicio, de primeraLlegada a ultimaLlegada. */
export function horasDeServicio(s: Servicio): string[] {
  const horas: string[] = [];
  for (let t = aMinutos(s.primeraLlegada); t <= aMinutos(s.ultimaLlegada); t += s.intervaloMinutos) {
    horas.push(deMinutos(t));
  }
  return horas;
}

export function cierreDe(config: ConfigReservas, fecha: string) {
  return config.cierres.find((c) => fecha >= c.desde && fecha <= c.hasta);
}

export function serviciosDelDia(config: ConfigReservas, fecha: string): Servicio[] {
  const dia = diaSemana(fecha);
  return config.servicios.filter((s) => s.dias.includes(dia));
}

/** Primera y última fecha reservables a partir de "ahora". */
export function rangoReservable(config: ConfigReservas, ahora: AhoraLocal) {
  return { desde: ahora.fecha, hasta: sumarDias(ahora.fecha, config.antelacion.maxDias) };
}

function ocupados(ocupacion: Ocupacion[], servicio: string, hora?: string): number {
  return ocupacion
    .filter((o) => o.servicio === servicio && (hora === undefined || o.hora === hora))
    .reduce((total, o) => total + o.personas, 0);
}

/** ¿Caben `personas` más en esa franja? */
export function cabe(s: Servicio, hora: string, personas: number, ocupacion: Ocupacion[]): boolean {
  if (ocupados(ocupacion, s.id) + personas > s.aforo) return false;
  if (s.aforoPorFranja !== undefined && ocupados(ocupacion, s.id, hora) + personas > s.aforoPorFranja) return false;
  return true;
}

export function disponibilidadDelDia(
  config: ConfigReservas,
  fecha: string,
  personas: number,
  ocupacion: Ocupacion[],
  ahora: AhoraLocal,
): ResultadoDia {
  if (!esFechaValida(fecha)) return { franjas: [], motivo: 'fecha_invalida' };
  if (personas < config.personas.min || personas > config.personas.maxOnline) {
    return { franjas: [], motivo: 'personas_fuera_de_rango' };
  }
  const { hasta } = rangoReservable(config, ahora);
  if (fecha < ahora.fecha) return { franjas: [], motivo: 'fecha_pasada' };
  if (fecha > hasta) return { franjas: [], motivo: 'fuera_de_plazo' };

  const cierre = cierreDe(config, fecha);
  if (cierre) return { franjas: [], motivo: 'cerrado', ...(cierre.motivo && { detalle: cierre.motivo }) };

  const servicios = serviciosDelDia(config, fecha);
  if (servicios.length === 0) return { franjas: [], motivo: 'sin_servicio' };

  const limite = marcaLocal(ahora.fecha, ahora.hora) + config.antelacion.minMinutos;
  const franjas = servicios.flatMap((s) =>
    horasDeServicio(s)
      .filter((h) => marcaLocal(fecha, h) >= limite)
      .map((h) => ({
        servicio: s.id,
        nombreServicio: s.nombre,
        hora: h,
        disponible: cabe(s, h, personas, ocupacion),
      })),
  );
  return { franjas };
}

/** Valida una franja concreta justo antes de guardar (dentro del bloqueo de la BD). */
export function comprobarFranja(
  config: ConfigReservas,
  fecha: string,
  hora: string,
  personas: number,
  ocupacion: Ocupacion[],
  ahora: AhoraLocal,
): { ok: true; servicio: Servicio } | { ok: false; motivo: MotivoNoDisponible | 'hora_no_ofrecida' | 'completo' } {
  const dia = disponibilidadDelDia(config, fecha, personas, [], ahora);
  if (dia.motivo) return { ok: false, motivo: dia.motivo };
  const franja = dia.franjas.find((f) => f.hora === hora);
  if (!franja) return { ok: false, motivo: 'hora_no_ofrecida' };
  const servicio = config.servicios.find((s) => s.id === franja.servicio)!;
  if (!cabe(servicio, hora, personas, ocupacion)) return { ok: false, motivo: 'completo' };
  return { ok: true, servicio };
}

/** Servicio al que pertenece una hora en una fecha (para reservas telefónicas). */
export function servicioDeHora(config: ConfigReservas, fecha: string, hora: string): Servicio | undefined {
  return serviciosDelDia(config, fecha).find((s) => horasDeServicio(s).includes(hora));
}

export const MENSAJES: Record<MotivoNoDisponible | 'hora_no_ofrecida' | 'completo', string> = {
  fecha_invalida: 'La fecha no es válida.',
  fecha_pasada: 'Esa fecha ya ha pasado.',
  fuera_de_plazo: 'Todavía no aceptamos reservas para esa fecha.',
  cerrado: 'Ese día el restaurante está cerrado.',
  sin_servicio: 'Ese día no abrimos.',
  personas_fuera_de_rango: 'Para ese número de personas, contacta directamente con el restaurante.',
  hora_no_ofrecida: 'Esa hora no está disponible para reservar.',
  completo: 'Lo sentimos, esa hora acaba de completarse. Elige otra, por favor.',
};
