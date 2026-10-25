// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import propuestas from './src/integrations/propuestas.ts';
import negocio from './src/data/negocio.json' with { type: 'json' };

/**
 * trixel.json declara qué módulos tiene el proyecto y si necesita servidor.
 * Lo mantiene `node tools/modulo.mjs` del estudio; no hace falta tocar este archivo.
 * @type {{ modulos: string[], servidor: boolean }}
 */
const trixel = JSON.parse(readFileSync(new URL('./trixel.json', import.meta.url), 'utf8'));

/** Cada módulo aporta su esquema de variables de entorno en trixel/<modulo>.mjs */
const modulos = await Promise.all(trixel.modulos.map((m) => import(`./trixel/${m}.mjs`)));
const esquemaEntorno = Object.assign({}, ...modulos.map((m) => m.entorno?.(envField) ?? {}));

// El adaptador solo se instala con módulos de servidor; el nombre va en una variable para que
// las webs estáticas (sin @astrojs/node) pasen la comprobación de tipos.
const paqueteAdaptador = '@astrojs/node';
const adaptador = trixel.servidor ? (await import(/* @vite-ignore */ paqueteAdaptador)).default({ mode: 'standalone' }) : undefined;

export default defineConfig({
  site: negocio.sitio.url,
  trailingSlash: 'never',
  build: { format: 'file' },
  ...(adaptador && { adapter: adaptador }),
  env: { schema: esquemaEntorno },
  integrations: [
    propuestas(),
    sitemap({
      filter: (pagina) => !/\/(propuestas|admin|reserva\/)/.test(pagina),
    }),
  ],
  image: {
    // Calidad alta por defecto: la fotografía es parte del diseño, no se sacrifica.
    layout: 'constrained',
    responsiveStyles: true,
  },
  devToolbar: { enabled: false },
});
