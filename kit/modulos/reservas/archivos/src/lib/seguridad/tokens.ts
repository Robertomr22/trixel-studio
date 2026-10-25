import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function tokenAleatorio(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(valor: string): string {
  return createHash('sha256').update(valor).digest('hex');
}

/** Código corto legible sin caracteres ambiguos (0/O, 1/I/L). */
export function codigoReserva(longitud = 6): string {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(longitud);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}

function firma(datos: string, secreto: string): string {
  return createHmac('sha256', secreto).update(datos).digest('base64url');
}

export function igualSeguro(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Firma un objeto JSON: "<datos>.<firma>". */
export function firmar(objeto: unknown, secreto: string): string {
  const datos = Buffer.from(JSON.stringify(objeto)).toString('base64url');
  return `${datos}.${firma(datos, secreto)}`;
}

export function verificar<T>(token: string, secreto: string): T | null {
  const [datos, f] = token.split('.');
  if (!datos || !f || !igualSeguro(f, firma(datos, secreto))) return null;
  try {
    return JSON.parse(Buffer.from(datos, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

/**
 * Token de formulario: prueba que la solicitud viene de alguien que cargó la disponibilidad
 * hace al menos `minSegundos` (los bots envían al instante) y no hace demasiado.
 */
export function crearTokenFormulario(secreto: string, ahoraMs = Date.now()): string {
  return firmar({ e: ahoraMs, p: 'reserva' }, secreto);
}

export function validarTokenFormulario(
  token: string,
  secreto: string,
  { minSegundos = 3, maxSegundos = 2 * 60 * 60, ahoraMs = Date.now() } = {},
): 'ok' | 'invalido' | 'demasiado_rapido' | 'caducado' {
  const datos = verificar<{ e: number; p: string }>(token, secreto);
  if (!datos || datos.p !== 'reserva' || typeof datos.e !== 'number') return 'invalido';
  const edad = (ahoraMs - datos.e) / 1000;
  if (edad < minSegundos) return 'demasiado_rapido';
  if (edad > maxSegundos) return 'caducado';
  return 'ok';
}
