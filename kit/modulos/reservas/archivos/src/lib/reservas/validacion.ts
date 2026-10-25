import { z } from 'astro/zod';
import { esFechaValida, esHoraValida } from './fechas';

const texto = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Sin caracteres de control (evita cabeceras inyectadas en correos y basura en el panel).
    .refine((v) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v), 'Caracteres no válidos');

export const solicitudSchema = z.object({
  fecha: z.string().refine(esFechaValida, 'Fecha no válida'),
  hora: z.string().refine(esHoraValida, 'Hora no válida'),
  personas: z.coerce.number().int().min(1).max(50),
  nombre: texto(120).pipe(z.string().min(2, 'Escribe tu nombre')),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Email no válido')),
  telefono: texto(32).pipe(z.string().regex(/^\+?[\d\s().-]{9,}$/, 'Teléfono no válido')),
  comentarios: texto(600).optional().default(''),
  /** Aceptación de la política de privacidad (obligatoria). */
  acepto: z.union([z.literal(true), z.literal('on'), z.literal('true')], {
    error: 'Debes aceptar la política de privacidad',
  }),
  /** Campo trampa: los humanos no lo ven; si llega relleno, es un bot. */
  web: z.string().max(0, 'Solicitud rechazada').optional().default(''),
  /** Token firmado que entrega la consulta de disponibilidad. */
  t: z.string().min(10, 'Solicitud caducada, recarga la página'),
});

export type Solicitud = z.infer<typeof solicitudSchema>;

export const reservaManualSchema = solicitudSchema
  .omit({ acepto: true, web: true, t: true })
  .extend({
    email: z.union([z.literal(''), z.string().trim().toLowerCase().pipe(z.email('Email no válido'))]),
    telefono: z.union([z.literal(''), texto(32).pipe(z.string().regex(/^\+?[\d\s().-]{9,}$/, 'Teléfono no válido'))]),
    estado: z.enum(['pendiente', 'confirmada']).default('confirmada'),
    forzar: z.union([z.literal('on'), z.literal('true')]).optional(),
  });

/** Primer error de validación legible, para mostrar al usuario. */
export function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos no válidos';
}
