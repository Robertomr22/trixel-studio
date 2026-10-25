#!/usr/bin/env node
/**
 * Capturas de pantalla completas en móvil (390), tablet (820) y escritorio (1440).
 *
 *   node tools/capturas.mjs <slug> --propuestas [--ronda 2]   → propuestas/capturas/ronda-N/
 *   node tools/capturas.mjs <slug> [--rutas /,/carta]          → entrega/capturas/ (usa el build)
 *   Opciones: --url http://… (servidor ya arrancado), --puerto 4400, --anchos 390,1440
 *
 * Sirven para la revisión visual de Claude (las abre con Read), para el revisor de diseño
 * y para enseñar al cliente. Se desactivan las animaciones para que sean estables.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { argumentos, arrancarServidor, color, importarDelProyecto, proyecto, salir } from './lib/comun.mjs';

const { posicionales, opciones } = argumentos();
const { slug, dir, web } = proyecto(posicionales[0]);
const anchos = String(opciones.anchos ?? '390,820,1440').split(',').map(Number);
const puerto = Number(opciones.puerto ?? 4400);
const modoPropuestas = Boolean(opciones.propuestas);

let rutas;
let salida;
if (modoPropuestas) {
  const carpeta = join(web, 'src', 'propuestas');
  const ids = existsSync(carpeta)
    ? readdirSync(carpeta, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
    : [];
  if (ids.length === 0) salir('No hay propuestas en web/src/propuestas/<id>/index.astro');
  rutas = ids.map((id) => `/propuestas/${id}`);
  const ronda = opciones.ronda ?? siguienteRonda(join(dir, 'propuestas', 'capturas'));
  salida = join(dir, 'propuestas', 'capturas', `ronda-${ronda}`);
} else {
  rutas = opciones.rutas ? String(opciones.rutas).split(',') : rutasDelBuild();
  salida = join(dir, 'entrega', 'capturas');
}
mkdirSync(salida, { recursive: true });

function siguienteRonda(base) {
  if (!existsSync(base)) return 1;
  const n = readdirSync(base).map((d) => Number(/^ronda-(\d+)$/.exec(d)?.[1] ?? 0));
  return Math.max(0, ...n) + 1;
}

function rutasDelBuild() {
  for (const c of [join(web, 'dist', 'client'), join(web, 'dist')]) {
    if (!existsSync(c)) continue;
    const mapa = readdirSync(c).find((f) => /^sitemap-\d+\.xml$/.test(f));
    if (mapa) {
      return [...readFileSync(join(c, mapa), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    }
  }
  salir('No hay build. Ejecuta "npm run build" en web/ o indica --rutas.');
}

const pw = await importarDelProyecto(web, 'playwright');
const chromium = pw.chromium ?? pw.default?.chromium;
const navegador = await chromium.launch();
let parar = () => {};
let base = opciones.url;
if (!base) {
  console.log(color.suave(`Arrancando servidor (${modoPropuestas ? 'dev:propuestas' : 'preview'})…`));
  parar = await arrancarServidor(web, modoPropuestas ? 'dev:propuestas' : 'preview', puerto, modoPropuestas ? [] : ['--ignore-lock']);
  base = `http://127.0.0.1:${puerto}`;
}
process.on('exit', () => parar());

const errores = [];
try {
  for (const ancho of anchos) {
    const pagina = await navegador.newPage({ viewport: { width: ancho, height: ancho < 600 ? 844 : 900 }, reducedMotion: 'reduce', locale: 'es-ES' });
    pagina.on('pageerror', (e) => errores.push(`${pagina.url()}: ${e.message}`));
    pagina.on('console', (m) => m.type() === 'error' && errores.push(`${pagina.url()}: ${m.text()}`));
    for (const ruta of rutas) {
      await pagina.goto(new URL(ruta, base).href, { waitUntil: 'networkidle' });
      // Fuerza la carga de imágenes diferidas antes de capturar la página completa.
      await pagina.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        await document.fonts.ready;
      });
      await pagina.waitForLoadState('networkidle');
      const nombre = `${ruta.replace(/^\/$/, 'inicio').replace(/^\//, '').replaceAll('/', '_')}-${ancho}.png`;
      await pagina.screenshot({ path: join(salida, nombre), fullPage: true });
      console.log(`  ${color.ok('✓')} ${nombre}`);
    }
    await pagina.close();
  }
} finally {
  await navegador.close();
  parar();
}

console.log(color.ok(`✓ Capturas de ${slug} en ${salida}`));
if (errores.length) {
  console.log(color.aviso(`⚠ Errores de consola durante las capturas:\n  ${[...new Set(errores)].join('\n  ')}`));
  process.exitCode = 2;
}
