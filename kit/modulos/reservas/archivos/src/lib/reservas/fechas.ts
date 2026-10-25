/**
 * Utilidades de fecha sin dependencias. Todas las fechas de reservas son LOCALES del
 * restaurante ("YYYY-MM-DD" y "HH:MM"); nunca se convierten a UTC para evitar errores
 * de un día en los cambios de horario.
 */
import type { DiaSemana } from './tipos';

const DIAS: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

export function esHoraValida(hora: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

export function diaSemana(fecha: string): DiaSemana {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]!;
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

export function deMinutos(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Minutos "de reloj local" comparables entre sí (fecha + hora tratadas como naive). */
export function marcaLocal(fecha: string, hora: string): number {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return Date.UTC(a, m - 1, d) / 60000 + aMinutos(hora);
}

export interface AhoraLocal {
  fecha: string;
  hora: string;
}

/** Fecha y hora actuales en la zona horaria del restaurante. */
export function ahoraEn(zonaHoraria: string, instante = new Date()): AhoraLocal {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zonaHoraria,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  );
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` };
}

/** "sábado, 14 de noviembre de 2026" */
export function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(a, m - 1, d)));
}
