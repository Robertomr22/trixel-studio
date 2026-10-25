/**
 * Comprobación de estado para después de publicar: ¿conecta la base de datos? ¿hay correo?
 * No revela secretos ni datos de reservas.
 */
import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';
import { dependencias, json, modoCorreo } from '../../lib/servidor/contexto';

export const prerender = false;

export const GET: APIRoute = async () => {
  const d = dependencias();
  let baseDeDatos = false;
  try {
    await d.db.execute(sql`SELECT 1`);
    baseDeDatos = true;
  } catch {
    baseDeDatos = false;
  }
  const ok = baseDeDatos && modoCorreo !== 'sin_configurar' && d.config.configurado;
  return json({ ok, baseDeDatos, correo: modoCorreo, reservasConfiguradas: d.config.configurado }, ok ? 200 : 503);
};
