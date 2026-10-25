#!/usr/bin/env node
/**
 * Añade un módulo funcional del kit a un proyecto.
 *
 *   node tools/modulo.mjs listar
 *   node tools/modulo.mjs añadir <modulo> <slug> [--forzar]
 *
 * Copia los archivos del módulo a web/, une dependencias y scripts en package.json,
 * añade sus variables a .env.example, activa el servidor si lo necesita (trixel.json)
 * y genera .env / .env.test locales con secretos aleatorios (solo para desarrollo y pruebas).
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { appendFileSync, cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { argumentos, color, escribirJson, KIT, leerJson, proyecto, salir } from './lib/comun.mjs';

const { posicionales, opciones } = argumentos();
const [accion, nombreModulo, slug] = posicionales;
const MODULOS = join(KIT, 'modulos');

if (accion === 'listar' || !accion) {
  for (const m of readdirSync(MODULOS)) {
    const info = leerJson(join(MODULOS, m, 'modulo.json'));
    console.log(`${color.negrita(m)}${info.servidor ? color.suave(' (necesita servidor Node)') : ''}\n  ${info.descripcion}`);
  }
  process.exit(0);
}
if (accion !== 'añadir' && accion !== 'anadir') salir('Uso: node tools/modulo.mjs añadir <modulo> <slug>');

const origen = join(MODULOS, nombreModulo ?? '');
if (!nombreModulo || !existsSync(join(origen, 'modulo.json'))) salir(`No existe el módulo "${nombreModulo}". Usa: listar`);
const { web } = proyecto(slug);
const info = leerJson(join(origen, 'modulo.json'));

// 1. Archivos (nunca se pisan los que el proyecto ya personalizó)
const protegidos = new Set(info.archivosProyecto ?? []);
const omitidos = [];
cpSync(join(origen, 'archivos'), web, {
  recursive: true,
  force: true,
  filter: (src) => {
    const rel = relative(join(origen, 'archivos'), src).replaceAll('\\', '/');
    if (!rel) return true;
    const destino = join(web, rel);
    if (existsSync(destino) && !readdirSafe(destino) && (protegidos.has(rel) || !opciones.forzar)) {
      omitidos.push(rel);
      return false;
    }
    return true;
  },
});

function readdirSafe(ruta) {
  try {
    readdirSync(ruta);
    return true; // es carpeta
  } catch {
    return false;
  }
}

// 2. package.json
const pkgRuta = join(web, 'package.json');
const pkg = leerJson(pkgRuta);
pkg.dependencies = ordenar({ ...pkg.dependencies, ...info.dependencias });
pkg.devDependencies = ordenar({ ...pkg.devDependencies, ...info.devDependencias });
pkg.scripts = { ...pkg.scripts, ...info.scripts };
escribirJson(pkgRuta, pkg);

function ordenar(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}

// 3. trixel.json
const trixelRuta = join(web, 'trixel.json');
const trixel = leerJson(trixelRuta);
if (!trixel.modulos.includes(info.nombre)) trixel.modulos.push(info.nombre);
trixel.servidor = trixel.servidor || Boolean(info.servidor);
escribirJson(trixelRuta, trixel);

// 4. Variables de entorno
const ejemplo = join(web, '.env.example');
if (info.entorno?.length && !readFileSync(ejemplo, 'utf8').includes(info.entorno[0])) {
  appendFileSync(ejemplo, `\n${info.entorno.join('\n')}\n`);
}

if (info.nombre === 'reservas') {
  const bd = slug.replaceAll('-', '_');
  const claveAdmin = randomBytes(12).toString('base64url');
  const sal = randomBytes(16);
  const hash = scryptSync(claveAdmin, sal, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const comunes = (base) => [
    `# Generado por tools/modulo.mjs para uso LOCAL. No sirve para producción.`,
    `DATABASE_URL=mysql://trixel:trixel_local@127.0.0.1:3306/${bd}_${base}`,
    `ADMIN_USUARIO=admin`,
    `ADMIN_HASH=scrypt:${2 ** 15}:8:1:${sal.toString('base64url')}:${hash.toString('base64url')}`,
    `SESION_SECRETO=${randomBytes(32).toString('base64url')}`,
    `EMAIL_AVISOS=sala@example.com`,
    `EMAIL_REMITENTE=reservas@example.com`,
    `CORREO_LOCAL=1`,
  ];
  if (!existsSync(join(web, '.env'))) {
    writeFileSync(join(web, '.env'), [...comunes('dev'), `URL_PUBLICA=http://localhost:4321`, `# Contraseña local del panel: ${claveAdmin}`, ''].join('\n'));
  }
  const sqlInicial = join(web, 'scripts', 'bd-inicial.sql');
  if (!existsSync(sqlInicial)) {
    writeFileSync(
      sqlInicial,
      [
        `-- Bases de datos locales de ${slug} (las usa docker-compose.bd.yml).`,
        ...['dev', 'test'].flatMap((b) => [
          `CREATE DATABASE IF NOT EXISTS \`${bd}_${b}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
          `GRANT ALL PRIVILEGES ON \`${bd}_${b}\`.* TO 'trixel'@'%';`,
        ]),
        'FLUSH PRIVILEGES;',
        '',
      ].join('\n'),
    );
  }
  if (!existsSync(join(web, '.env.test'))) {
    writeFileSync(join(web, '.env.test'), [...comunes('test'), `URL_PUBLICA=http://127.0.0.1:4399`, `TEST_ADMIN_CLAVE=${claveAdmin}`, ''].join('\n'));
  }
}

console.log(color.ok(`✓ Módulo "${info.nombre}" añadido a ${slug}`));
if (omitidos.length) console.log(color.aviso(`  Conservados (ya existían): ${omitidos.join(', ')}`));
for (const nota of info.notas ?? []) console.log(`  • ${nota}`);
console.log(color.suave('  Ejecuta "npm install" en web/ para instalar las dependencias nuevas.'));
