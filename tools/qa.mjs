#!/usr/bin/env node
/**
 * Control de calidad previo a la entrega. Complementa (no sustituye) a `npm run verificar`.
 *
 *   node tools/qa.mjs <slug> [--completo] [--demo]
 *
 *   --completo  ejecuta antes npm run verificar (tipos, unitarias, integración, build, navegador)
 *   --demo      permite esDemo: true (proyectos de demostración)
 *
 * Revisa lo que las pruebas no ven: datos PENDIENTE, textos de relleno, marcadores del kit,
 * propuestas filtradas al build, secretos en el código, .env en Git, imágenes pesadas,
 * configuración de reservas, SEO básico y dependencias vulnerables.
 * Escribe el informe en entrega/informe-qa.md. Código de salida 1 si hay errores.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { argumentos, color, ejecutar, ejecutarCaptura, leerJson, proyecto } from './lib/comun.mjs';

const { posicionales, opciones } = argumentos();
const { slug, dir, web } = proyecto(posicionales[0]);
const resultados = [];
const anotar = (nivel, area, mensaje) => resultados.push({ nivel, area, mensaje });

if (opciones.completo) {
  console.log(color.suave('Ejecutando npm run verificar…'));
  const codigo = ejecutar('npm', ['run', 'verificar'], { cwd: web });
  anotar(codigo === 0 ? 'ok' : 'error', 'Pruebas', codigo === 0 ? 'npm run verificar pasa completo' : 'npm run verificar FALLA (ver salida)');
}

function archivos(carpeta, filtro = () => true, acc = []) {
  if (!existsSync(carpeta)) return acc;
  for (const e of readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.git', '.astro'].includes(e.name)) archivos(ruta, filtro, acc);
    } else if (filtro(ruta)) acc.push(ruta);
  }
  return acc;
}

// --- Datos del negocio ---
const negocio = leerJson(join(web, 'src', 'data', 'negocio.json'));
const pendientes = [];
(function buscar(v, ruta) {
  if (typeof v === 'string' && v.startsWith('PENDIENTE')) pendientes.push(ruta);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) buscar(x, ruta ? `${ruta}.${k}` : k);
})(negocio, '');
if (pendientes.length) anotar('error', 'Datos', `Campos PENDIENTE en negocio.json: ${pendientes.join(', ')}`);
else anotar('ok', 'Datos', 'negocio.json sin campos pendientes');

if (/example\.(com|org)|localhost/.test(negocio.sitio.url)) anotar('error', 'SEO', `sitio.url no es el dominio real (${negocio.sitio.url})`);
if (negocio.esDemo && !opciones.demo) anotar('error', 'Datos', 'esDemo: true (la web mostraría aviso de demo y no se indexaría). Usa --demo si es intencionado.');
if (negocio.esDemo && opciones.demo) anotar('aviso', 'Datos', 'Proyecto de demostración: no indexable y con aviso visible');

// --- Módulos ---
const trixel = leerJson(join(web, 'trixel.json'));
if (trixel.modulos.includes('reservas')) {
  const cfg = readFileSync(join(web, 'src', 'data', 'reservas.config.ts'), 'utf8');
  if (/configurado:\s*false/.test(cfg)) anotar('error', 'Reservas', 'reservas.config.ts tiene configurado: false');
  else anotar('ok', 'Reservas', 'Configuración de reservas marcada como real');
}

// --- Build ---
const distCliente = existsSync(join(web, 'dist', 'client')) ? join(web, 'dist', 'client') : join(web, 'dist');
if (!existsSync(distCliente)) {
  anotar('error', 'Build', 'No hay build (npm run build)');
} else {
  const html = archivos(distCliente, (f) => f.endsWith('.html'));
  const relleno = /lorem ipsum|dolor sit amet|TRIXEL-MARCADOR|PENDIENTE:|tu empresa aquí|texto de ejemplo|placeholder\.com|via\.placeholder|picsum\.photos/i;
  for (const f of html) {
    const contenido = readFileSync(f, 'utf8');
    const m = relleno.exec(contenido);
    if (m) anotar('error', 'Contenido', `${relative(web, f)} contiene "${m[0]}"`);
    if (!/<meta name="description" content=".{50,}/.test(contenido) && !f.endsWith('404.html')) {
      anotar('aviso', 'SEO', `${relative(web, f)}: meta description ausente o corta`);
    }
  }
  if (existsSync(join(distCliente, 'propuestas'))) anotar('error', 'Build', 'Las propuestas se han colado en el build de producción');
  if (!existsSync(join(distCliente, 'robots.txt'))) anotar('error', 'SEO', 'Falta robots.txt');
  if (!readdirSync(distCliente).some((f) => f.startsWith('sitemap'))) anotar('error', 'SEO', 'Falta sitemap');
  for (const legal of ['aviso-legal', 'privacidad', 'cookies']) {
    if (!existsSync(join(distCliente, 'legal', `${legal}.html`))) anotar('error', 'Legal', `Falta /legal/${legal}`);
  }
  const pesadas = archivos(distCliente, (f) => ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(extname(f).toLowerCase()))
    .filter((f) => statSync(f).size > 450 * 1024)
    .map((f) => `${relative(distCliente, f)} (${Math.round(statSync(f).size / 1024)} KB)`);
  if (pesadas.length) anotar('aviso', 'Rendimiento', `Imágenes de más de 450 KB: ${pesadas.join(', ')}`);
  const js = archivos(distCliente, (f) => f.endsWith('.js')).reduce((t, f) => t + statSync(f).size, 0);
  anotar(js > 150 * 1024 ? 'aviso' : 'ok', 'Rendimiento', `JavaScript total en cliente: ${Math.round(js / 1024)} KB`);
  if (!pesadas.length && html.length) anotar('ok', 'Build', `${html.length} páginas HTML revisadas`);
}

// --- Secretos ---
const sospechosos = /(sk_live_[0-9a-z]{10,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|password|clave|token)["']?\s*[:=]\s*["'][^"'$\s]{16,}["'])/i;
const codigo = archivos(join(web, 'src'), (f) => /\.(astro|ts|tsx|js|mjs|json)$/.test(f));
const conSecreto = codigo.filter((f) => sospechosos.test(readFileSync(f, 'utf8')));
if (conSecreto.length) anotar('error', 'Seguridad', `Posibles secretos en el código: ${conSecreto.map((f) => relative(web, f)).join(', ')}`);
else anotar('ok', 'Seguridad', 'Sin secretos aparentes en src/');

const rastreados = ejecutarCaptura('git', ['ls-files'], { cwd: dir });
if (rastreados.codigo === 0) {
  const envs = rastreados.salida.split('\n').filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example'));
  if (envs.length) anotar('error', 'Seguridad', `Archivos .env en Git: ${envs.join(', ')}`);
  else anotar('ok', 'Seguridad', 'Ningún .env versionado');
}

const auditoria = ejecutarCaptura('npm', ['audit', '--omit=dev', '--audit-level=high', '--json'], { cwd: web });
try {
  const v = JSON.parse(auditoria.salida).metadata?.vulnerabilities ?? {};
  const graves = (v.high ?? 0) + (v.critical ?? 0);
  anotar(graves ? 'error' : 'ok', 'Dependencias', graves ? `${graves} vulnerabilidades altas/críticas (npm audit)` : 'npm audit: sin vulnerabilidades altas en producción');
} catch {
  anotar('aviso', 'Dependencias', 'No se pudo ejecutar npm audit (¿sin conexión?)');
}

// --- Informe ---
const icono = { ok: '✅', aviso: '⚠️', error: '❌' };
const errores = resultados.filter((r) => r.nivel === 'error').length;
const avisos = resultados.filter((r) => r.nivel === 'aviso').length;
const informe = [
  `# Informe de calidad · ${slug}`,
  '',
  `Generado: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })} · ${errores} errores · ${avisos} avisos`,
  '',
  '| | Área | Resultado |',
  '|---|---|---|',
  ...resultados.map((r) => `| ${icono[r.nivel]} | ${r.area} | ${r.mensaje.replaceAll('|', '\\|')} |`),
  '',
  '> Este informe cubre comprobaciones automáticas. La revisión visual (capturas + revisor de diseño) y',
  '> la revisión legal por el titular se documentan aparte en PROYECTO.md.',
  '',
].join('\n');
writeFileSync(join(dir, 'entrega', 'informe-qa.md'), informe);

for (const r of resultados) {
  const pinta = r.nivel === 'ok' ? color.ok : r.nivel === 'aviso' ? color.aviso : color.error;
  console.log(`${pinta(r.nivel.toUpperCase().padEnd(5))} ${r.area}: ${r.mensaje}`);
}
console.log(`\nInforme: clientes/${slug}/entrega/informe-qa.md`);
process.exit(errores ? 1 : 0);
