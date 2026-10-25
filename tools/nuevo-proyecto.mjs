#!/usr/bin/env node
/**
 * Crea un proyecto de cliente LIMPIO a partir del kit, sin nada de otros clientes.
 *
 *   node tools/nuevo-proyecto.mjs <slug> --nombre "Nombre del negocio" [--sector restaurante] [--instalar]
 *
 * Resultado: clientes/<slug>/ con su propio repositorio Git, PROYECTO.md, brief, carpetas
 * de recursos y propuestas, y la web técnica en web/ (copia del kit base).
 */
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { argumentos, CLIENTES, color, ejecutar, ejecutarCaptura, escribirJson, KIT, leerJson, RAIZ, salir } from './lib/comun.mjs';

const { posicionales, opciones } = argumentos();
const slug = posicionales[0];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  salir('Uso: node tools/nuevo-proyecto.mjs <slug-en-minusculas> --nombre "Nombre" [--sector restaurante] [--instalar]');
}
const nombre = typeof opciones.nombre === 'string' ? opciones.nombre : 'PENDIENTE: nombre del negocio';
const sector = typeof opciones.sector === 'string' ? opciones.sector : 'PENDIENTE';
const dir = join(CLIENTES, slug);
if (existsSync(dir)) salir(`Ya existe clientes/${slug}. Elige otro nombre o continúa ese proyecto.`);

const hoy = new Date().toISOString().slice(0, 10);

// 1. Estructura
for (const sub of ['recursos/fotos', 'recursos/logo', 'recursos/textos', 'recursos/referencias', 'propuestas/capturas', 'entrega']) {
  mkdirSync(join(dir, sub), { recursive: true });
}

// 2. Web técnica desde el kit (filtrando restos de instalaciones o builds)
cpSync(join(KIT, 'base'), join(dir, 'web'), {
  recursive: true,
  filter: (origen) => !/[\\/](node_modules|dist|dist-propuestas|\.astro|informes|capturas|\.correos)([\\/]|$)/.test(origen),
});
const pkgRuta = join(dir, 'web', 'package.json');
const pkg = leerJson(pkgRuta);
pkg.name = slug;
escribirJson(pkgRuta, pkg);

const negocioRuta = join(dir, 'web', 'src', 'data', 'negocio.json');
const negocio = leerJson(negocioRuta);
negocio.nombre = nombre;
escribirJson(negocioRuta, negocio);

// 3. Documentación viva del proyecto
const plantilla = (archivo) =>
  readFileSync(join(RAIZ, 'docs', 'plantillas', archivo), 'utf8')
    .replaceAll('{{NOMBRE}}', nombre)
    .replaceAll('{{SLUG}}', slug)
    .replaceAll('{{SECTOR}}', sector)
    .replaceAll('{{FECHA}}', hoy);
writeFileSync(join(dir, 'PROYECTO.md'), plantilla('PROYECTO.md'));
writeFileSync(join(dir, 'brief.md'), plantilla('brief.md'));
writeFileSync(join(dir, 'recursos', 'LEEME.md'), plantilla('recursos-LEEME.md'));
writeFileSync(join(dir, 'propuestas', 'rondas.md'), plantilla('rondas.md'));
writeFileSync(
  join(dir, '.gitignore'),
  ['web/node_modules/', 'web/dist/', 'web/dist-propuestas/', 'web/.astro/', 'web/informes/', 'web/.correos/', '**/.env', '**/.env.*', '!**/.env.example', '.DS_Store', 'Thumbs.db', ''].join('\n'),
);

// 4. Repositorio Git propio, con protección básica contra secretos
if (ejecutarCaptura('git', ['--version']).codigo === 0) {
  ejecutarCaptura('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const hook = join(dir, '.git', 'hooks', 'pre-commit');
  cpSync(join(RAIZ, 'tools', 'git', 'pre-commit'), hook);
  try {
    chmodSync(hook, 0o755);
  } catch {
    /* Windows */
  }
  ejecutarCaptura('git', ['add', '-A'], { cwd: dir });
  ejecutarCaptura('git', ['commit', '-q', '-m', `Proyecto ${slug} creado desde el kit Trixel`], { cwd: dir });
}

console.log(color.ok(`✓ Proyecto creado en clientes/${slug}`));

if (opciones.instalar) {
  console.log(color.suave('Instalando dependencias de web/…'));
  if (ejecutar('npm', ['install', '--no-fund', '--no-audit'], { cwd: join(dir, 'web') }) !== 0) {
    salir('npm install falló. Revisa la conexión y vuelve a ejecutarlo dentro de web/.');
  }
  // Navegador para pruebas y capturas (no hace nada si ya está instalado).
  if (ejecutar('npx', ['playwright', 'install', 'chromium'], { cwd: join(dir, 'web') }) !== 0) {
    console.log(color.aviso('⚠ No se pudo instalar Chromium para Playwright. Ejecuta "npx playwright install chromium" en web/.'));
  }
}

console.log(`
Siguiente:
  1. Rellena clientes/${slug}/brief.md (o dile a Claude: /nueva-web ${slug})
  2. Copia el material del cliente en clientes/${slug}/recursos/
  3. ${opciones.instalar ? '' : `cd clientes/${slug}/web && npm install && `}npm run dev:propuestas
`);
