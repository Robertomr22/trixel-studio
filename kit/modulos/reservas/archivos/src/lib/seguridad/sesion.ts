/**
 * Sesión del panel de administración en una cookie firmada (HMAC), HttpOnly y SameSite=Strict.
 * Caduca a las 8 horas. Cambiar SESION_SECRETO invalida todas las sesiones abiertas.
 */
import type { AstroCookies } from 'astro';
import { firmar, verificar } from './tokens';

export const COOKIE_SESION = 'trixel_admin';
const DURACION_MS = 8 * 60 * 60 * 1000;

interface DatosSesion {
  u: string;
  exp: number;
}

export function abrirSesion(cookies: AstroCookies, usuario: string, secreto: string, seguro: boolean) {
  const datos: DatosSesion = { u: usuario, exp: Date.now() + DURACION_MS };
  cookies.set(COOKIE_SESION, firmar(datos, secreto), {
    httpOnly: true,
    secure: seguro,
    sameSite: 'strict',
    path: '/',
    maxAge: DURACION_MS / 1000,
  });
}

export function leerSesion(cookies: AstroCookies, secreto: string): string | null {
  const valor = cookies.get(COOKIE_SESION)?.value;
  if (!valor) return null;
  const datos = verificar<DatosSesion>(valor, secreto);
  if (!datos || typeof datos.exp !== 'number' || datos.exp < Date.now()) return null;
  return datos.u;
}

export function cerrarSesion(cookies: AstroCookies) {
  cookies.delete(COOKIE_SESION, { path: '/' });
}
