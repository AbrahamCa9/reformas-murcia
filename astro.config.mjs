// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import hostinger from './integrations/hostinger.mjs';
import { leerNegocio, leerUrlMap, leerRedirecciones, leerEstadoContenido } from './src/lib/datos-base.mjs';

const negocio = leerNegocio();
const urlMap = leerUrlMap();

// 301: /{servicio}/ → /servicios/{servicio}/ (es la carpeta "padre" de cada landing)
// + las de src/data/redirecciones.yaml (slugs que cambian)
const redirecciones = [
  .../** @type {string[]} */ (urlMap.servicios).map((s) => ({ desde: `/${s}/`, hacia: `/servicios/${s}/` })),
  ...leerRedirecciones(),
];

// lastmod real (campo `actualizado` del contenido) y borradores fuera del sitemap
const { fechas, pendientes } = leerEstadoContenido();
const fueraDelSitemap = new Set(['/contacto/gracias/', '/404/', ...pendientes, ...redirecciones.map((r) => r.desde)]);

export default defineConfig({
  site: negocio.dominio,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  redirects: Object.fromEntries(redirecciones.map((r) => [r.desde, { status: 301, destination: r.hacia }])),
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (pagina) => !fueraDelSitemap.has(new URL(pagina).pathname),
      serialize: (item) => {
        const fecha = fechas.get(new URL(item.url).pathname);
        if (fecha) item.lastmod = fecha;
        return item;
      },
    }),
    hostinger({ redirecciones }),
  ],
});
