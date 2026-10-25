import type { diasSemana } from '../../data/negocio.schema';

export type DiaSemana = (typeof diasSemana)[number];

export interface Servicio {
  /** Identificador estable: "comida", "cena"… */
  id: string;
  nombre: string;
  dias: DiaSemana[];
  /** Primera hora de llegada que se ofrece (HH:MM). */
  primeraLlegada: string;
  /** Última hora de llegada que se ofrece (HH:MM). */
  ultimaLlegada: string;
  /** Minutos entre horas de llegada ofrecidas (15, 30…). */
  intervaloMinutos: number;
  /** Comensales máximos para todo el servicio (sumando reservas pendientes y confirmadas). */
  aforo: number;
  /** Opcional: comensales máximos que pueden llegar a la misma hora, para repartir la cocina. */
  aforoPorFranja?: number;
}

export interface Cierre {
  desde: string;
  hasta: string;
  motivo?: string;
}

export interface ConfigReservas {
  /** false mientras falten datos reales del restaurante: la API responde 503. */
  configurado: boolean;
  zonaHoraria: string;
  servicios: Servicio[];
  personas: { min: number; maxOnline: number };
  antelacion: { minMinutos: number; maxDias: number };
  cierres: Cierre[];
  /** Mensaje para grupos mayores que maxOnline (teléfono, email…). */
  textoGrupos: string;
  /** Días tras la fecha de la reserva en que se anonimizan los datos personales. */
  conservacionDias: number;
}

export type EstadoReserva = 'pendiente' | 'confirmada' | 'rechazada' | 'cancelada';
export type OrigenReserva = 'web' | 'telefono' | 'admin';

/** Comensales ya comprometidos en una franja (reservas pendientes + confirmadas). */
export interface Ocupacion {
  servicio: string;
  hora: string;
  personas: number;
}

export interface Franja {
  servicio: string;
  nombreServicio: string;
  hora: string;
  disponible: boolean;
}

export type MotivoNoDisponible =
  | 'fecha_invalida'
  | 'fecha_pasada'
  | 'fuera_de_plazo'
  | 'cerrado'
  | 'sin_servicio'
  | 'personas_fuera_de_rango';
