/**
 * Construye las dependencias reales a partir de las variables de entorno (astro:env).
 * Solo se importa desde rutas de servidor (API, panel); nunca llega al navegador.
 */
import {
  ADMIN_HASH,
  ADMIN_USUARIO,
  DATABASE_URL,
  EMAIL_AVISOS,
  EMAIL_REMITENTE,
  SESION_SECRETO,
  SMTP_CLAVE,
  SMTP_HOST,
  SMTP_PUERTO,
  SMTP_USUARIO,
  URL_PUBLICA,
} from 'astro:env/server';
import type { APIContext } from 'astro';
import { negocio } from '../../data/negocio';
import { configReservas } from '../../data/reservas.config';
import { crearBaseDeDatos, type BaseDeDatos } from '../db/conexion';
import { mensajeroLocal, mensajeroSmtp, type Mensajero } from '../reservas/correo';
import type { Dependencias } from '../reservas/servicio';
import { Limitador } from '../seguridad/limite';

const global = globalThis as unknown as { __trixelDb?: BaseDeDatos };

function db(): BaseDeDatos {
  global.__trixelDb ??= crearBaseDeDatos(DATABASE_URL).db;
  return global.__trixelDb;
}

export const modoCorreo: 'smtp' | 'local' | 'sin_configurar' =
  SMTP_HOST && SMTP_USUARIO && SMTP_CLAVE ? 'smtp' : import.meta.env.PROD && process.env.CORREO_LOCAL !== '1' ? 'sin_configurar' : 'local';

function mensajero(): Mensajero {
  if (modoCorreo === 'smtp') {
    return mensajeroSmtp({
      host: SMTP_HOST!,
      puerto: SMTP_PUERTO,
      usuario: SMTP_USUARIO!,
      clave: SMTP_CLAVE!,
      remitente: `${negocio.nombre} <${EMAIL_REMITENTE}>`,
    });
  }
  if (modoCorreo === 'local') return mensajeroLocal();
  return async () => {
    throw new Error('SMTP sin configurar en producción');
  };
}

export function dependencias(): Dependencias {
  return {
    db: db(),
    enviar: mensajero(),
    config: configReservas,
    restaurante: { nombre: negocio.nombre, telefono: negocio.contacto.telefono },
    urlBase: (URL_PUBLICA ?? negocio.sitio.url).replace(/\/$/, ''),
    emailAvisos: EMAIL_AVISOS,
    secreto: SESION_SECRETO,
  };
}

export const admin = { usuario: ADMIN_USUARIO, hash: ADMIN_HASH, secreto: SESION_SECRETO };

export const limites = {
  disponibilidad: new Limitador(60, 60_000),
  solicitudes: new Limitador(5, 10 * 60_000),
  login: new Limitador(5, 15 * 60_000),
};

/** IP del visitante (solo para limitar peticiones; no se guarda). */
export function ipDe(contexto: Pick<APIContext, 'clientAddress' | 'request'>): string {
  try {
    return contexto.clientAddress;
  } catch {
    return contexto.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconocida';
  }
}

export function json(datos: unknown, estado = 200, cabeceras: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras },
  });
}
