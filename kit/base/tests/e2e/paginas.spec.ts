/**
 * Comprobaciones comunes a TODAS las páginas del sitemap, en móvil, tablet y escritorio:
 * carga correcta, sin errores de consola, sin scroll horizontal, metadatos SEO,
 * un único h1, imágenes con alt y dimensiones, y accesibilidad (axe) sin fallos graves.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function rutasDelSitemap(): string[] {
  const carpetas = ['dist/client', 'dist'];
  for (const c of carpetas) {
    if (!existsSync(c)) continue;
    const mapas = readdirSync(c).filter((f) => /^sitemap-\d+\.xml$/.test(f));
    if (mapas.length === 0) continue;
    return mapas.flatMap((m) =>
      [...readFileSync(`${c}/${m}`, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((r) => new URL(r[1]!).pathname),
    );
  }
  return ['/'];
}

const rutas = rutasDelSitemap();

for (const ruta of rutas) {
  test(`página ${ruta}`, async ({ page }) => {
    const errores: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errores.push(m.text());
    });
    page.on('pageerror', (e) => errores.push(e.message));

    const respuesta = await page.goto(ruta, { waitUntil: 'networkidle' });
    expect(respuesta?.status(), 'código HTTP').toBe(200);

    await expect(page.locator('h1'), 'un único h1').toHaveCount(1);
    expect((await page.title()).length, 'title presente').toBeGreaterThan(10);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);

    const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desborde, 'sin scroll horizontal').toBeLessThanOrEqual(1);

    const imagenesMal = await page.$$eval('img', (imgs) =>
      imgs
        .filter((i) => !i.hasAttribute('alt') || !i.getAttribute('width') || !i.getAttribute('height'))
        .map((i) => i.currentSrc || i.src),
    );
    expect(imagenesMal, 'imágenes con alt, width y height').toEqual([]);

    const rotas = await page.$$eval('img', (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src),
    );
    expect(rotas, 'imágenes que no cargan').toEqual([]);

    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const graves = axe.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
    expect(graves, 'accesibilidad').toEqual([]);

    expect(errores, 'errores de consola').toEqual([]);
  });
}

test('404 devuelve la página propia', async ({ page }) => {
  const r = await page.goto('/esta-ruta-no-existe');
  expect(r?.status()).toBe(404);
  await expect(page.locator('h1')).toBeVisible();
});
