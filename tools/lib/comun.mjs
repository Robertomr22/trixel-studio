/** Utilidades compartidas por los scripts del estudio. Sin dependencias externas. */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { parseEnv } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CLIENTES = join(RAIZ, 'clientes');
export const KIT = join(RAIZ, 'kit');
export const ES_WINDOWS = process.platform === 'win32';

export const color = {
  ok: (t) => `\x1b[32m${t}\x1b[0m`,
  aviso: (t) => `\x1b[33m${t}\x1b[0m`,
  error: (t) => `\x1b[31m${t}\x1b[0m`,
  suave: (t) => `\x1b[2m${t}\x1b[0m`,
  negrita: (t) => `\x1b[1m${t}\x1b[0m`,
};

export function salir(mensaje, codigo = 1) {
  console.error(color.error(`✗ ${mensaje}`));
  process.exit(codigo);
}

export function leerJson(ruta) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

export function escribirJson(ruta, datos) {
  writeFileSync(ruta, `${JSON.stringify(datos, null, 2)}\n`, 'utf8');
}

/** Ruta del proyecto de un cliente; termina el proceso si no existe. */
export function proyecto(slug) {
  if (!slug) salir('Indica el proyecto: node tools/<script>.mjs <slug>');
  const dir = join(CLIENTES, slug);
  if (!existsSync(join(dir, 'web', 'package.json'))) salir(`No existe el proyecto "${slug}" en clientes/`);
  return { slug, dir, web: join(dir, 'web') };
}

export function argumentos(argv = process.argv.slice(2)) {
  const posicionales = [];
  const opciones = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) opciones[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) opciones[k] = argv[++i];
      else opciones[k] = true;
    } else posicionales.push(a);
  }
  return { posicionales, opciones };
}

export function ejecutar(comando, args, opciones = {}) {
  const r = spawnSync(comando, args, { stdio: 'inherit', shell: ES_WINDOWS, ...opciones });
  return r.status ?? 1;
}

export function ejecutarCaptura(comando, args, opciones = {}) {
  const r = spawnSync(comando, args, { encoding: 'utf8', shell: ES_WINDOWS, ...opciones });
  return { codigo: r.status ?? 1, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function puertoAbierto(puerto, host = '127.0.0.1') {
  return new Promise((ok) => {
    const s = createConnection({ port: puerto, host }, () => {
      s.end();
      ok(true);
    });
    s.on('error', () => ok(false));
  });
}

/** Arranca un servidor (npm run <script>) y espera a que responda. Devuelve una función para pararlo. */
export async function arrancarServidor(cwd, script, puerto, extraArgs = []) {
  if (await puertoAbierto(puerto)) salir(`El puerto ${puerto} ya está ocupado. Cierra el otro servidor o usa --puerto.`);
  const hijo = spawn('npm', ['run', script, '--', '--port', String(puerto), '--host', '127.0.0.1', ...extraArgs], {
    cwd,
    shell: ES_WINDOWS,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Variables locales del proyecto (.env de desarrollo), nunca las de producción.
    env: {
      ...process.env,
      ...(existsSync(join(cwd, '.env')) ? parseEnv(readFileSync(join(cwd, '.env'), 'utf8')) : {}),
      PORT: String(puerto),
      HOST: '127.0.0.1',
    },
    detached: !ES_WINDOWS,
  });
  let registro = '';
  hijo.stdout.on('data', (d) => (registro += d));
  hijo.stderr.on('data', (d) => (registro += d));
  const inicio = Date.now();
  while (!(await puertoAbierto(puerto))) {
    if (hijo.exitCode !== null || Date.now() - inicio > 90_000) {
      console.error(registro);
      salir(`No se pudo arrancar "npm run ${script}".`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return () => {
    try {
      if (ES_WINDOWS) spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F']);
      else process.kill(-hijo.pid, 'SIGTERM');
    } catch {
      /* ya terminado */
    }
  };
}

/** Importa un paquete instalado en el proyecto web (p. ej. playwright). */
export async function importarDelProyecto(web, paquete) {
  const { createRequire } = await import('node:module');
  const requerir = createRequire(join(web, 'package.json'));
  try {
    return await import(new URL(`file://${requerir.resolve(paquete).replaceAll('\\', '/')}`).href);
  } catch {
    salir(`Falta "${paquete}" en el proyecto. Ejecuta "npm install" dentro de web/.`);
  }
}
