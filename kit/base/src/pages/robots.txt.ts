import type { APIRoute } from 'astro';
import { negocio } from '../data/negocio';

export const GET: APIRoute = ({ site }) => {
  const lineas = negocio.esDemo
    ? ['User-agent: *', 'Disallow: /']
    : [
        'User-agent: *',
        'Disallow: /admin',
        'Disallow: /api/',
        '',
        `Sitemap: ${new URL('/sitemap-index.xml', site).href}`,
      ];
  return new Response(lineas.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
