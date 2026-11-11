// robots.txt: solo el build de Hostinger (INDEXAR=si) deja rastrear.
import type { APIRoute } from 'astro';
import { INDEXAR, absoluta } from '../lib/datos';

export const GET: APIRoute = () => {
  const cuerpo = INDEXAR
    ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${absoluta('/sitemap-index.xml')}\n`
    : '# Versión de pruebas: no indexar\nUser-agent: *\nDisallow: /\n';
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
