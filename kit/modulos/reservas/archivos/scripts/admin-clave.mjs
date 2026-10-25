#!/usr/bin/env node
/**
 * Genera el valor de ADMIN_HASH para el panel de reservas.
 * Uso: npm run admin:clave   (pide la contraseña sin mostrarla)
 * La contraseña nunca se guarda: solo su hash scrypt, que va en las variables de entorno.
 */
import { randomBytes, scrypt } from 'node:crypto';
import { createInterface } from 'node:readline';

function preguntarOculto(texto) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(texto)) rl.output.write(s);
    };
    rl.question(texto, (r) => {
      rl.close();
      process.stdout.write('\n');
      resolve(r);
    });
  });
}

const clave = process.argv[2] ?? (await preguntarOculto('Contraseña del panel (mín. 12 caracteres): '));
if (clave.length < 12) {
  console.error('La contraseña debe tener al menos 12 caracteres.');
  process.exit(1);
}

const N = 2 ** 15, r = 8, p = 1;
const sal = randomBytes(16);
const hash = await new Promise((ok, mal) =>
  scrypt(clave.normalize('NFKC'), sal, 32, { N, r, p, maxmem: 64 * 1024 * 1024 }, (e, h) => (e ? mal(e) : ok(h))),
);
console.log(`ADMIN_HASH=${['scrypt', N, r, p, sal.toString('base64url'), hash.toString('base64url')].join(':')}`);
console.log(`SESION_SECRETO=${randomBytes(32).toString('base64url')}   # solo si aún no tienes uno`);
