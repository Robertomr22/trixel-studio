/**
 * Hash de contraseñas con scrypt (incluido en Node, sin dependencias nativas).
 * Formato: scrypt:N:r:p:<sal base64url>:<hash base64url> (sin $ para que los .env no lo interpreten)
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

function scrypt(clave: string, sal: Buffer, longitud: number, opciones: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(clave, sal, longitud, opciones, (err, derivada) => (err ? reject(err) : resolve(derivada))),
  );
}

const N = 2 ** 15;
const R = 8;
const P = 1;
const LONGITUD = 32;
const MEMORIA = 64 * 1024 * 1024;

export async function hashClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scrypt(clave.normalize('NFKC'), sal, LONGITUD, { N, r: R, p: P, maxmem: MEMORIA });
  return ['scrypt', N, R, P, sal.toString('base64url'), hash.toString('base64url')].join(':');
}

export async function verificarClave(clave: string, almacenado: string): Promise<boolean> {
  const [alg, n, r, p, sal, hash] = almacenado.split(':');
  if (alg !== 'scrypt' || !n || !r || !p || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64url');
  const calculado = await scrypt(clave.normalize('NFKC'), Buffer.from(sal, 'base64url'), esperado.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MEMORIA,
  });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}
