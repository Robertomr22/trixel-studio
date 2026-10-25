import type { APIRoute } from 'astro';
import { solicitarReserva } from '../../../lib/reservas/servicio';
import { primerError, solicitudSchema } from '../../../lib/reservas/validacion';
import { dependencias, ipDe, json, limites } from '../../../lib/servidor/contexto';

export const prerender = false;

export const POST: APIRoute = async (contexto) => {
  // Solo JSON: un formulario de otra web no puede enviar este tipo sin permiso del navegador (CORS).
  if (!contexto.request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'formato', mensaje: 'Formato no admitido.' }, 415);
  }
  if (!limites.solicitudes.permitir(ipDe(contexto))) {
    return json({ error: 'demasiadas_peticiones', mensaje: 'Has hecho demasiadas solicitudes. Inténtalo más tarde.' }, 429);
  }

  let cuerpo: unknown;
  try {
    cuerpo = await contexto.request.json();
  } catch {
    return json({ error: 'formato', mensaje: 'Datos no válidos.' }, 400);
  }

  const datos = solicitudSchema.safeParse(cuerpo);
  if (!datos.success) {
    const campo = datos.error.issues[0]?.path[0];
    return json({ error: 'validacion', campo, mensaje: primerError(datos.error) }, 422);
  }

  try {
    const resultado = await solicitarReserva(dependencias(), datos.data);
    if (!resultado.ok) return json({ error: 'reserva', mensaje: resultado.mensaje }, resultado.estado);
    const r = resultado.valor;
    return json({ codigo: r.codigo, estado: r.estado, fecha: r.fecha, hora: r.hora, personas: r.personas }, 201);
  } catch (error) {
    console.error('[reservas] Error creando reserva:', (error as Error).message);
    return json({ error: 'servidor', mensaje: 'No hemos podido registrar la solicitud. Inténtalo de nuevo o llámanos.' }, 500);
  }
};
