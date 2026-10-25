import type { APIRoute } from 'astro';
import { cerrarSesion } from '../../lib/seguridad/sesion';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cerrarSesion(cookies);
  return redirect('/admin/login', 303);
};
