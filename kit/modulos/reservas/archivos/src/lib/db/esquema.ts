import { datetime, index, int, mysqlEnum, mysqlTable, smallint, uniqueIndex, varchar, char, date } from 'drizzle-orm/mysql-core';

export const reservas = mysqlTable(
  'reservas',
  {
    id: int('id').autoincrement().primaryKey(),
    /** Referencia legible para el cliente y el restaurante, p. ej. "K7M2Q9". */
    codigo: varchar('codigo', { length: 12 }).notNull(),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    hora: varchar('hora', { length: 5 }).notNull(),
    servicio: varchar('servicio', { length: 32 }).notNull(),
    personas: smallint('personas').notNull(),
    nombre: varchar('nombre', { length: 120 }).notNull(),
    email: varchar('email', { length: 254 }),
    telefono: varchar('telefono', { length: 32 }),
    comentarios: varchar('comentarios', { length: 600 }).notNull().default(''),
    estado: mysqlEnum('estado', ['pendiente', 'confirmada', 'rechazada', 'cancelada']).notNull().default('pendiente'),
    origen: mysqlEnum('origen', ['web', 'telefono', 'admin']).notNull().default('web'),
    /** SHA-256 del token del enlace de cancelación; el token en claro solo viaja en el correo. */
    tokenCancelacion: char('token_cancelacion', { length: 64 }),
    consentimientoEn: datetime('consentimiento_en'),
    anonimizadaEn: datetime('anonimizada_en'),
    creadaEn: datetime('creada_en').notNull(),
    actualizadaEn: datetime('actualizada_en').notNull(),
  },
  (t) => [
    uniqueIndex('reservas_codigo_uq').on(t.codigo),
    index('reservas_fecha_servicio_idx').on(t.fecha, t.servicio, t.estado),
    index('reservas_email_idx').on(t.email),
  ],
);

/** Historial de cambios de cada reserva (quién/qué/cuándo), útil ante dudas o reclamaciones. */
export const eventosReserva = mysqlTable(
  'reservas_eventos',
  {
    id: int('id').autoincrement().primaryKey(),
    reservaId: int('reserva_id')
      .notNull()
      .references(() => reservas.id, { onDelete: 'cascade' }),
    accion: varchar('accion', { length: 40 }).notNull(),
    detalle: varchar('detalle', { length: 600 }).notNull().default(''),
    creadoEn: datetime('creado_en').notNull(),
  },
  (t) => [index('eventos_reserva_idx').on(t.reservaId)],
);

/** Ajustes internos clave-valor (p. ej. fecha de la última anonimización). */
export const ajustes = mysqlTable('ajustes', {
  clave: varchar('clave', { length: 64 }).primaryKey(),
  valor: varchar('valor', { length: 255 }).notNull(),
});

export type Reserva = typeof reservas.$inferSelect;
