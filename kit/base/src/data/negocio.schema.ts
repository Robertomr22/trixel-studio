/**
 * Datos reales del negocio: la única fuente de verdad para nombre, contacto,
 * dirección, horarios y datos legales. Las propuestas y la web final leen de aquí.
 *
 * Regla: nunca inventar. Si un dato falta, escribir "PENDIENTE: <qué falta>".
 * `tools/qa.mjs` y la skill de entrega bloquean la publicación mientras quede alguno.
 */
import { z } from 'astro/zod';

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^PENDIENTE/, 'Formato HH:MM');

export const diasSemana = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
] as const;

export const negocioSchema = z.object({
  /** true = proyecto de demostración: la web muestra un aviso visible y no se indexa. */
  esDemo: z.boolean(),
  nombre: z.string().min(1),
  /** Sector según schema.org (Restaurant, Dentist, LegalService, HomeAndConstructionBusiness…). */
  tipoSchemaOrg: z.string().min(1),
  descripcion: z.string().min(1),
  sitio: z.object({
    /** URL definitiva con https y sin barra final. */
    url: z.url(),
    idioma: z.string().default('es'),
  }),
  contacto: z.object({
    telefono: z.string().optional(),
    email: z.string().optional(),
    /** Número internacional sin + ni espacios, p. ej. 34600111222 */
    whatsapp: z.string().optional(),
  }),
  direccion: z
    .object({
      calle: z.string(),
      codigoPostal: z.string(),
      localidad: z.string(),
      provincia: z.string(),
      pais: z.string().default('ES'),
      /** Enlace "Cómo llegar" (Google Maps, Apple Maps u OpenStreetMap). */
      enlaceMapa: z.string().optional(),
      coordenadas: z.object({ lat: z.number(), lng: z.number() }).optional(),
    })
    .optional(),
  horarios: z
    .array(
      z.object({
        dias: z.array(z.enum(diasSemana)).min(1),
        abre: hora,
        cierra: hora,
        nota: z.string().optional(),
      }),
    )
    .default([]),
  redes: z.array(z.object({ nombre: z.string(), url: z.url() })).default([]),
  /**
   * Registros oficiales que deben mostrarse: inscripción en el Registro de Turismo de Andalucía,
   * nº de colegiado, registro sanitario… Se muestran en el aviso legal (y donde pida el diseño).
   */
  registros: z.array(z.object({ nombre: z.string(), numero: z.string(), ambito: z.string().optional() })).default([]),
  /** Titular de la web para el aviso legal (LSSI art. 10). */
  titular: z.object({
    nombreORazonSocial: z.string(),
    nif: z.string(),
    domicilio: z.string(),
    email: z.string(),
    datosRegistro: z.string().optional(),
  }),
});

export type Negocio = z.infer<typeof negocioSchema>;

/** Devuelve las rutas de los campos que siguen marcados como PENDIENTE. */
export function camposPendientes(valor: unknown, ruta = ''): string[] {
  if (typeof valor === 'string') return valor.startsWith('PENDIENTE') ? [ruta || '(raíz)'] : [];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => camposPendientes(v, `${ruta}[${i}]`));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([k, v]) => camposPendientes(v, ruta ? `${ruta}.${k}` : k));
  }
  return [];
}
