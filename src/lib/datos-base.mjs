// Lectura de los archivos de datos y del blueprint.
// JavaScript puro para que lo usen igual la web (Astro), astro.config.mjs y los scripts de QA.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/** Carpeta del blueprint activo (Fase 4). */
export const CARPETA_BLUEPRINT = 'blueprint/reformas-murcia';

const raiz = () => process.cwd();
export const ruta = (...partes) => join(raiz(), ...partes);

export function leerYaml(rel) {
  const fichero = ruta(rel);
  if (!existsSync(fichero)) throw new Error(`No existe ${rel}`);
  return parse(readFileSync(fichero, 'utf8')) ?? {};
}

export function leerJson(rel) {
  return JSON.parse(readFileSync(ruta(rel), 'utf8'));
}

/** Frontmatter YAML de un archivo Markdown. */
export function leerFrontmatter(rel) {
  const texto = readFileSync(ruta(rel), 'utf8');
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? parse(m[1]) : {};
}

export const leerNegocio = () => leerYaml('src/data/negocio.yaml');
export const leerUrlMap = () => leerYaml(`${CARPETA_BLUEPRINT}/url-map.yaml`);
export const leerEnlazado = () => leerYaml(`${CARPETA_BLUEPRINT}/internal-linking.yaml`);
export const leerPresupuesto = () => leerJson(`${CARPETA_BLUEPRINT}/lighthouse-budget.json`);
export const leerPlantilla = (tipo) => leerFrontmatter(`${CARPETA_BLUEPRINT}/page-templates/${tipo}.md`);
export const leerContratoSchema = (tipo) => leerJson(`${CARPETA_BLUEPRINT}/schema-templates/${tipo}.jsonld`);
export const leerRedirecciones = () => leerYaml('src/data/redirecciones.yaml').redirecciones ?? [];

/** Pares servicio × zona del url-map, en orden. */
export function paresServicioZona(urlMap = leerUrlMap()) {
  const pares = [];
  for (const bloque of urlMap.servicio_x_zona ?? []) {
    for (const zona of bloque.zonas ?? []) pares.push({ servicio: bloque.servicio, zona });
  }
  return pares;
}

/** Teléfono en formato E.164 (+34695437154) y solo dígitos para wa.me. */
export const telefonoE164 = (tel) => '+' + String(tel).replace(/[^\d]/g, '');
export const telefonoWa = (tel) => String(tel).replace(/[^\d]/g, '');

/** ¿Se puede indexar este build? Solo el despliegue final en Hostinger pone INDEXAR=si. */
export const indexable = () => process.env.INDEXAR === 'si';

/**
 * Fecha de actualización (lastmod) y borradores (`pendiente: true`) del contenido, por URL.
 * Lo usan el sitemap (astro.config.mjs) y el QA.
 */
export function leerEstadoContenido() {
  const fechas = new Map();
  const pendientes = new Set();
  const anotar = (url, rel) => {
    const fm = leerFrontmatter(rel);
    if (fm.actualizado) fechas.set(url, String(fm.actualizado instanceof Date ? fm.actualizado.toISOString() : fm.actualizado).slice(0, 10));
    if (fm.pendiente === true) pendientes.add(url);
  };
  const md = (dir) => (existsSync(ruta(dir)) ? readdirSync(ruta(dir)).filter((f) => f.endsWith('.md')) : []);
  for (const f of md('src/content/servicios')) anotar(`/servicios/${f.slice(0, -3)}/`, `src/content/servicios/${f}`);
  for (const f of md('src/content/zonas')) anotar(`/zonas/${f.slice(0, -3)}/`, `src/content/zonas/${f}`);
  if (existsSync(ruta('src/content/landings'))) {
    for (const s of readdirSync(ruta('src/content/landings'))) {
      for (const f of md(`src/content/landings/${s}`)) anotar(`/${s}/${f.slice(0, -3)}/`, `src/content/landings/${s}/${f}`);
    }
  }
  const paginas = { inicio: '/', 'sobre-nosotros': '/sobre-nosotros/', contacto: '/contacto/' };
  for (const [id, url] of Object.entries(paginas)) {
    if (existsSync(ruta(`src/content/paginas/${id}.md`))) anotar(url, `src/content/paginas/${id}.md`);
  }
  return { fechas, pendientes };
}
