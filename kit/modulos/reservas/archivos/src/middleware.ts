/**
 * Middleware de las rutas de servidor:
 *  - Protege /admin (salvo /admin/login) con la sesión firmada.
 *  - Añade cabeceras de seguridad y evita que se cacheen respuestas privadas.
 * Las páginas estáticas no pasan por aquí; sus cabeceras se configuran en el hosting.
 */
import { defineMiddleware } from 'astro:middleware';
import { leerSesion } from './lib/seguridad/sesion';

export const onRequest = defineMiddleware(async (contexto, siguiente) => {
  const ruta = contexto.url.pathname;
  const esAdmin = ruta === '/admin' || ruta.startsWith('/admin/');

  if (contexto.isPrerendered) return siguiente();

  let respuesta: Response | undefined;
  if (esAdmin && ruta !== '/admin/login') {
    const { admin } = await import('./lib/servidor/contexto');
    const usuario = leerSesion(contexto.cookies, admin.secreto);
    if (usuario) contexto.locals.admin = usuario;
    else respuesta = contexto.redirect('/admin/login', 303);
  }
  respuesta ??= await siguiente();

  const h = respuesta.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (esAdmin || ruta.startsWith('/api/') || ruta.startsWith('/reserva/')) {
    h.set('Cache-Control', 'no-store');
    h.set('X-Frame-Options', 'DENY');
    h.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return respuesta;
});
