/**
 * Integración de propuestas visuales.
 *
 * Cada carpeta src/propuestas/<id>/index.astro se publica en /propuestas/<id>
 * y /propuestas muestra el comparador. Solo existen en `astro dev` o con PROPUESTAS=1:
 * el build de producción nunca las incluye.
 */
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

export default function propuestas(): AstroIntegration {
  return {
    name: 'trixel-propuestas',
    hooks: {
      'astro:config:setup': ({ command, config, injectRoute, logger }) => {
        const activar = command === 'dev' || process.env.PROPUESTAS === '1';
        if (!activar) return;

        const carpeta = new URL('./src/propuestas/', config.root);
        if (!existsSync(carpeta)) return;

        const ids = readdirSync(carpeta, { withFileTypes: true })
          .filter((e) => e.isDirectory() && existsSync(new URL(`./${e.name}/index.astro`, carpeta)))
          .map((e) => e.name)
          .sort();

        for (const id of ids) {
          injectRoute({
            pattern: `/propuestas/${id}`,
            entrypoint: fileURLToPath(new URL(`./${id}/index.astro`, carpeta)),
            prerender: true,
          });
        }
        injectRoute({
          pattern: '/propuestas',
          entrypoint: fileURLToPath(new URL('./propuestas/Comparador.astro', import.meta.url)),
          prerender: true,
        });
        logger.info(`Propuestas activas: ${ids.join(', ') || '(ninguna)'} → /propuestas`);
      },
    },
  };
}
