#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Control de calidad (Fase 6) sobre la web ya compilada en dist/.
//
//   npm run qa                 → informe en qa/AAAA-MM-DD/ y resumen en consola
//   npm run qa -- --estricto   → además falla si queda algo pendiente (lo usa el despliegue)
//
// Sale con código 1 si hay errores. Las reglas salen del blueprint:
// page-templates (mínimos), schema-templates (contratos), internal-linking.yaml y lighthouse-budget.json.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'node-html-parser';
import {
  leerNegocio,
  leerUrlMap,
  leerEnlazado,
  leerPresupuesto,
  leerPlantilla,
  leerContratoSchema,
  paresServicioZona,
  leerEstadoContenido,
  ruta,
  telefonoE164,
} from '../src/lib/datos-base.mjs';

const estricto = process.argv.includes('--estricto');
const produccion = process.env.INDEXAR === 'si';
const DIST = ruta('dist');
if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta antes `npm run build`.');
  process.exit(1);
}

const negocio = leerNegocio();
const urlMap = leerUrlMap();
const enlazado = leerEnlazado();
const presupuesto = leerPresupuesto();
const pares = paresServicioZona(urlMap);
const { pendientes: borradores } = leerEstadoContenido();
const TIPOS = ['home', 'service-pillar', 'service-area', 'area-hub'];
const plantillas = Object.fromEntries(TIPOS.map((t) => [t, leerPlantilla(t)]));
const contratos = Object.fromEntries(TIPOS.map((t) => [t, leerContratoSchema(t)]));
const host = new URL(negocio.dominio).host;
const telE164 = telefonoE164(negocio.telefono);
const telVisible = negocio.telefono.replace(/^\+34\s?/, '');

const errores = [];
const avisos = [];
const error = (url, regla, detalle) => errores.push({ url, regla, detalle });
const aviso = (url, regla, detalle) => avisos.push({ url, regla, detalle });
const pendiente = (url, regla, detalle) => (estricto ? error : aviso)(url, regla, detalle);

// ── 1. Leer dist/ ─────────────────────────────────────────────────────────────
const archivos = [];
(function recorrer(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else archivos.push(p);
  }
})(DIST);

const aUrl = (archivo) => {
  const rel = '/' + relative(DIST, archivo).split('\\').join('/');
  if (rel === '/404.html') return '/404/';
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};
const existe = new Set(archivos.map((a) => '/' + relative(DIST, a).split('\\').join('/')));

const palabrasDe = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
const normal = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
const tejas = (t, n = 3) => {
  const w = normal(t);
  const s = new Set();
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' '));
  return s;
};

const paginas = new Map();
for (const archivo of archivos.filter((a) => a.endsWith('.html'))) {
  const url = aUrl(archivo);
  const html = readFileSync(archivo, 'utf8');
  const doc = parse(html, { comment: false });
  const redireccion = Boolean(doc.querySelector('meta[http-equiv="refresh"]'));
  const main = doc.querySelector('main');
  const estilos = doc.querySelectorAll('style').reduce((n, s) => n + s.innerHTML.length, 0);
  const scripts = doc.querySelectorAll('script').filter((s) => s.getAttribute('type') !== 'application/ld+json');
  const jsInline = scripts.reduce((n, s) => n + s.innerHTML.length, 0);
  const jsExterno = scripts
    .map((s) => s.getAttribute('src'))
    .filter((src) => src && src.startsWith('/'))
    .reduce((n, src) => n + (existe.has(src) ? statSync(join(DIST, src)).size : 0), 0);
  const cssExterno = doc
    .querySelectorAll('link[rel="stylesheet"]')
    .map((l) => l.getAttribute('href'))
    .filter((h) => h && h.startsWith('/'))
    .reduce((n, h) => n + (existe.has(h) ? statSync(join(DIST, h)).size : 0), 0);
  if (main) main.querySelectorAll('script, style').forEach((n) => n.remove());
  const texto = (main?.text ?? '').replace(/\s+/g, ' ').trim();
  const ld = [];
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.innerHTML);
      ld.push(...(Array.isArray(j['@graph']) ? j['@graph'] : [j]));
    } catch (e) {
      error(url, 'schema-json', `JSON-LD no válido: ${e.message}`);
    }
  }
  paginas.set(url, {
    url,
    html,
    doc,
    redireccion,
    tipo: doc.querySelector('body')?.getAttribute('data-plantilla') ?? '',
    title: doc.querySelector('title')?.text.trim() ?? '',
    meta: doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    robots: doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    h1s: doc.querySelectorAll('h1').map((h) => h.text.replace(/\s+/g, ' ').trim()),
    texto,
    palabras: palabrasDe(texto).length,
    faqs: doc.querySelectorAll('.faq-item').length,
    ld,
    enlaces: doc.querySelectorAll('a[href]').map((a) => ({ href: a.getAttribute('href'), texto: a.text.replace(/\s+/g, ' ').trim() })),
    bytes: Buffer.byteLength(html),
    gzip: gzipSync(html).length,
    css: estilos + cssExterno,
    js: jsInline + jsExterno,
    salientes: new Set(),
    entrantes: 0,
  });
}

const reales = [...paginas.values()].filter((p) => !p.redireccion);
const noindexPorDiseno = (p) => ['noindex'].includes(p.tipo) || p.url === '/404/' || borradores.has(p.url);
const indexables = reales.filter((p) => !noindexPorDiseno(p));

// ── 2. Páginas que pide el url-map ────────────────────────────────────────────
const esperadas = [
  '/',
  '/servicios/',
  '/zonas/',
  ...urlMap.servicios.map((s) => `/servicios/${s}/`),
  ...(urlMap.zonas ?? []).map((z) => `/zonas/${z}/`),
  ...pares.map(({ servicio, zona }) => `/${servicio}/${zona}/`),
  ...(urlMap.paginas ?? []).filter((p) => !['servicios', 'zonas'].includes(p)).map((p) => `/${p}/`),
  ...(urlMap.legales ?? []).map((p) => `/${p}/`),
];
for (const u of esperadas) if (!paginas.has(u)) error(u, 'pagina-falta', 'El url-map pide esta página y no se ha generado');
for (const u of borradores) if (paginas.has(u)) pendiente(u, 'borrador', 'Página en borrador (pendiente: true): sale con noindex y fuera del sitemap');

// ── 3. Comprobaciones por página ──────────────────────────────────────────────
const RE_PENDIENTE = /\[PENDIENTE|\[POR COMPLETAR|\{\{?[a-z_]+\}?\}|lorem ipsum/i;
const SUBTIPOS = { LocalBusiness: ['GeneralContractor', 'HomeAndConstructionBusiness'], Organization: ['GeneralContractor', 'LocalBusiness'] };
const tipoCoincide = (esperado, real) => {
  const reales = [real].flat();
  return reales.includes(esperado) || (SUBTIPOS[esperado] ?? []).some((t) => reales.includes(t));
};
function cumpleContrato(contrato, nodo, camino, faltan) {
  if (contrato === null || typeof contrato !== 'object') return;
  if (Array.isArray(contrato)) {
    if (!Array.isArray(nodo) || !nodo.length) return faltan.push(`${camino} (lista vacía)`);
    if (contrato[0] && typeof contrato[0] === 'object') {
      const ok = nodo.some((n) => {
        const f = [];
        cumpleContrato(contrato[0], n, camino + '[]', f);
        return f.length === 0;
      });
      if (!ok) cumpleContrato(contrato[0], nodo[0], camino + '[0]', faltan);
    }
    return;
  }
  if (Array.isArray(nodo)) {
    const ok = nodo.some((n) => {
      const f = [];
      cumpleContrato(contrato, n, camino, f);
      return f.length === 0;
    });
    if (!ok) faltan.push(`${camino} (ningún elemento cumple)`);
    return;
  }
  if (!nodo || typeof nodo !== 'object') return faltan.push(camino);
  if (contrato['@type'] && !tipoCoincide(contrato['@type'], nodo['@type'])) return faltan.push(`${camino} @type=${contrato['@type']}`);
  for (const [k, v] of Object.entries(contrato)) {
    if (k === '@context') continue;
    if (!(k in nodo)) faltan.push(`${camino}.${k}`);
    else if (typeof v === 'object') cumpleContrato(v, nodo[k], `${camino}.${k}`, faltan);
  }
}

for (const p of reales) {
  const indexable = !noindexPorDiseno(p);
  if (!p.title) error(p.url, 'title', 'Falta <title>');
  else if (p.title.length > 65) aviso(p.url, 'title-largo', `${p.title.length} caracteres (máx. 65): ${p.title}`);
  if (!p.meta) error(p.url, 'meta', 'Falta meta description');
  else if (p.meta.length > 160) aviso(p.url, 'meta-larga', `${p.meta.length} caracteres (máx. 160)`);
  else if (indexable && p.meta.length < 70) aviso(p.url, 'meta-corta', `${p.meta.length} caracteres (mín. 70)`);
  if (p.h1s.length !== 1) error(p.url, 'h1', `Debe haber un H1 y hay ${p.h1s.length}`);
  if (p.canonical !== negocio.dominio + p.url && p.url !== '/404/') error(p.url, 'canonical', `Canonical "${p.canonical}" ≠ ${negocio.dominio + p.url}`);

  if (produccion) {
    if (indexable && !/(^|,\s*)index/.test(p.robots)) error(p.url, 'robots', `Debería ser indexable y tiene "${p.robots}"`);
    if (!indexable && !p.robots.includes('noindex')) error(p.url, 'robots', 'Debería llevar noindex');
  } else if (!p.robots.includes('noindex')) error(p.url, 'robots', 'Build de pruebas: todas las páginas deben llevar noindex');

  // NAP
  if (!p.html.includes(telVisible)) error(p.url, 'nap', `No aparece el teléfono ${telVisible}`);
  if (!p.html.includes(`tel:${telE164}`)) error(p.url, 'nap', `Falta el enlace tel:${telE164}`);
  for (const e of p.enlaces) if (e.href.startsWith('tel:') && e.href !== `tel:${telE164}`) error(p.url, 'nap', `Teléfono distinto: ${e.href}`);

  // Imágenes
  for (const img of p.doc.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) error(p.url, 'img-alt', `Imagen sin alt: ${img.getAttribute('src')}`);
    if (!img.getAttribute('width') || !img.getAttribute('height')) aviso(p.url, 'img-medidas', `Imagen sin width/height: ${img.getAttribute('src')}`);
  }

  // Textos sin terminar
  const m = (p.title + ' ' + p.meta + ' ' + p.texto).match(RE_PENDIENTE);
  if (m && indexable) pendiente(p.url, 'texto-pendiente', `Texto sin terminar: "${m[0]}"`);

  // Mínimos de la plantilla
  const pl = plantillas[p.tipo];
  if (pl && indexable) {
    if (p.palabras < pl.palabras_min) error(p.url, 'palabras', `${p.palabras} palabras (mín. ${pl.palabras_min})`);
    if (p.faqs < (pl.faq_min ?? 0)) error(p.url, 'faq', `${p.faqs} preguntas (mín. ${pl.faq_min})`);
    const faltan = [];
    for (const nodo of contratos[p.tipo]['@graph']) {
      const candidato = p.ld.find((n) => tipoCoincide(nodo['@type'], n['@type']));
      if (!candidato) faltan.push(`@type ${nodo['@type']}`);
      else cumpleContrato(nodo, candidato, nodo['@type'], faltan);
    }
    if (faltan.length) error(p.url, 'schema-contrato', `No cumple ${p.tipo}.jsonld: ${faltan.join(', ')}`);
  }

  // Presupuesto de recursos
  const lim = presupuesto.recursos_max_kb;
  if (p.bytes / 1024 > lim.html_por_pagina) error(p.url, 'peso-html', `${(p.bytes / 1024).toFixed(1)} KB (máx. ${lim.html_por_pagina})`);
  if (p.css / 1024 > lim.css_total) error(p.url, 'peso-css', `${(p.css / 1024).toFixed(1)} KB de CSS (máx. ${lim.css_total})`);
  if (p.js / 1024 > lim.js_total) error(p.url, 'peso-js', `${(p.js / 1024).toFixed(1)} KB de JS (máx. ${lim.js_total})`);
}

// Duplicados entre páginas indexables
for (const campo of ['title', 'meta']) {
  const vistos = new Map();
  for (const p of indexables) {
    if (!p[campo]) continue;
    if (vistos.has(p[campo])) error(p.url, `${campo}-duplicado`, `Igual que ${vistos.get(p[campo])}`);
    else vistos.set(p[campo], p.url);
  }
}
{
  const vistos = new Map();
  for (const p of indexables) {
    const h = p.h1s[0];
    if (h && vistos.has(h)) error(p.url, 'h1-duplicado', `Igual que ${vistos.get(h)}`);
    else if (h) vistos.set(h, p.url);
  }
}

// ── 4. Enlaces internos, huérfanas y profundidad ──────────────────────────────
const rotos = [];
for (const p of reales) {
  for (const e of p.enlaces) {
    let href = e.href;
    if (/^(mailto:|tel:|javascript:)/.test(href)) continue;
    if (href.startsWith('#')) {
      if (href.length > 1 && !p.doc.querySelector(`[id="${href.slice(1)}"]`)) error(p.url, 'ancla', `No existe ${href}`);
      continue;
    }
    if (/^https?:\/\//.test(href)) {
      const u = new URL(href);
      if (u.host !== host) continue;
      href = u.pathname;
    }
    const [destino, ancla] = href.split('#');
    const limpio = destino.split('?')[0] || p.url;
    const objetivo = paginas.get(limpio) ?? (limpio.endsWith('/') ? undefined : paginas.get(limpio + '/'));
    if (objetivo) {
      if (objetivo.redireccion) aviso(p.url, 'enlace-redireccion', `${limpio} es una redirección: enlaza al destino final`);
      if (!limpio.endsWith('/') && !extname(limpio)) aviso(p.url, 'barra-final', `${limpio} sin barra final`);
      if (ancla && !objetivo.doc.querySelector(`[id="${ancla}"]`)) error(p.url, 'ancla', `${limpio} no tiene #${ancla}`);
      if (objetivo.url !== p.url) {
        if (!p.salientes.has(objetivo.url)) objetivo.entrantes++;
        p.salientes.add(objetivo.url);
      }
    } else if (!existe.has(limpio)) {
      rotos.push({ desde: p.url, hacia: e.href, texto: e.texto });
      error(p.url, 'enlace-roto', `${e.href} ("${e.texto}")`);
    }
  }
}

const profundidad = new Map([['/', 0]]);
for (const cola = ['/']; cola.length; ) {
  const u = cola.shift();
  for (const d of paginas.get(u)?.salientes ?? []) {
    if (!profundidad.has(d)) {
      profundidad.set(d, profundidad.get(u) + 1);
      cola.push(d);
    }
  }
}
const maxClics = enlazado.profundidad_max_clics ?? 3;
for (const p of indexables) {
  if (p.url !== '/' && p.entrantes === 0) error(p.url, 'huerfana', 'Ninguna página enlaza aquí');
  const d = profundidad.get(p.url);
  if (d === undefined) error(p.url, 'profundidad', 'No se llega desde la home');
  else if (d > maxClics) error(p.url, 'profundidad', `A ${d} clics de la home (máx. ${maxClics})`);
}

// Reglas de internal-linking.yaml
const enlaza = (p, u) => p.salientes.has(u);
const home = paginas.get('/');
if (home) {
  for (const s of urlMap.servicios) if (!enlaza(home, `/servicios/${s}/`)) error('/', 'enlazado', `La home no enlaza /servicios/${s}/`);
  for (const z of urlMap.zonas ?? []) if (!enlaza(home, `/zonas/${z}/`)) error('/', 'enlazado', `La home no enlaza /zonas/${z}/`);
  if (!enlaza(home, '/contacto/')) error('/', 'enlazado', 'La home no enlaza /contacto/');
}
for (const s of urlMap.servicios) {
  const p = paginas.get(`/servicios/${s}/`);
  if (!p || borradores.has(p.url)) continue;
  const otros = [...p.salientes].filter((u) => u.startsWith('/servicios/') && u !== '/servicios/' && u !== p.url).length;
  const min = enlazado.servicio_pilar?.relacionados_min ?? 3;
  if (otros < min) error(p.url, 'enlazado', `Enlaza ${otros} servicios (mín. ${min})`);
  for (const { zona } of pares.filter((x) => x.servicio === s)) if (!enlaza(p, `/${s}/${zona}/`)) error(p.url, 'enlazado', `No enlaza /${s}/${zona}/`);
}
for (const { servicio, zona } of pares) {
  const p = paginas.get(`/${servicio}/${zona}/`);
  if (!p) continue;
  const reglas = enlazado.servicio_zona ?? {};
  const hermanas = pares.filter((x) => x.servicio === servicio && x.zona !== zona).map((x) => `/${servicio}/${x.zona}/`);
  const n = hermanas.filter((u) => enlaza(p, u)).length;
  const min = Math.min(reglas.hermanas_min ?? 3, hermanas.length);
  if (n < min) error(p.url, 'enlazado', `Enlaza ${n} pueblos del mismo servicio (mín. ${min})`);
  if (reglas.enlace_a_pilar && !enlaza(p, `/servicios/${servicio}/`)) error(p.url, 'enlazado', 'No enlaza su página pilar');
  if (reglas.enlace_a_hub_zona && !enlaza(p, `/zonas/${zona}/`)) error(p.url, 'enlazado', 'No enlaza el hub del pueblo');
  const otros = [...p.salientes].filter(
    (u) => (u.endsWith(`/${zona}/`) && !u.startsWith('/zonas/') && u !== p.url) || (u.startsWith('/servicios/') && u !== '/servicios/' && u !== `/servicios/${servicio}/`),
  ).length;
  if (otros < (reglas.otros_servicios_min ?? 2)) error(p.url, 'enlazado', `Enlaza ${otros} servicios más en ${zona} (mín. ${reglas.otros_servicios_min})`);
}
for (const z of urlMap.zonas ?? []) {
  const p = paginas.get(`/zonas/${z}/`);
  if (!p) continue;
  for (const { servicio } of pares.filter((x) => x.zona === z)) if (!enlaza(p, `/${servicio}/${z}/`)) error(p.url, 'enlazado', `No enlaza /${servicio}/${z}/`);
}

// ── 5. Contenido duplicado entre páginas del mismo tipo ───────────────────────
const duplicados = [];
const unicas = new Map();
for (const tipo of ['service-area', 'area-hub', 'service-pillar']) {
  const grupo = indexables.filter((p) => p.tipo === tipo).map((p) => ({ p, t: tejas(p.texto) }));
  const max = plantillas[tipo]?.similitud_max ?? 0.7;
  for (let i = 0; i < grupo.length; i++) {
    for (let j = i + 1; j < grupo.length; j++) {
      const a = grupo[i].t;
      const b = grupo[j].t;
      let comun = 0;
      for (const x of a) if (b.has(x)) comun++;
      const sim = comun / (a.size + b.size - comun || 1);
      duplicados.push({ a: grupo[i].p.url, b: grupo[j].p.url, sim });
      if (sim > max) (tipo === 'service-area' ? error : aviso)(grupo[i].p.url, 'similitud', `${(sim * 100).toFixed(0)} % igual que ${grupo[j].p.url} (máx. ${max * 100} %)`);
    }
  }
  if (tipo === 'service-area') {
    const minUnicas = plantillas[tipo].palabras_unicas_min ?? 150;
    for (const { p, t } of grupo) {
      const otras = grupo.filter((g) => g.p !== p);
      let propias = 0;
      for (const x of t) if (!otras.some((o) => o.t.has(x))) propias++;
      unicas.set(p.url, propias);
      if (propias < minUnicas) error(p.url, 'palabras-unicas', `${propias} palabras propias (mín. ${minUnicas})`);
    }
  }
}

// ── 6. Sitemap, robots, .htaccess, imágenes y datos del negocio ───────────────
const leer = (rel) => (existe.has(rel) ? readFileSync(join(DIST, rel), 'utf8') : null);
const indice = leer('/sitemap-index.xml');
if (!indice) error('/sitemap-index.xml', 'sitemap', 'No existe');
else {
  const urls = new Set();
  for (const [, loc] of indice.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const xml = leer(new URL(loc).pathname) ?? '';
    for (const [, u] of xml.matchAll(/<loc>(.*?)<\/loc>/g)) urls.add(u);
  }
  const esperado = new Set(indexables.map((p) => negocio.dominio + p.url));
  for (const u of esperado) if (!urls.has(u)) error(u, 'sitemap', 'Página indexable que falta en el sitemap');
  for (const u of urls) if (!esperado.has(u)) error(u, 'sitemap', 'Está en el sitemap y no debería (noindex, borrador o redirección)');
}
const robots = leer('/robots.txt') ?? '';
if (produccion) {
  if (/^Disallow:\s*\/\s*$/m.test(robots)) error('/robots.txt', 'robots', 'Bloquea toda la web en producción');
  if (!/^Sitemap:/m.test(robots)) error('/robots.txt', 'robots', 'Falta la línea Sitemap:');
} else if (!/^Disallow:\s*\/\s*$/m.test(robots)) aviso('/robots.txt', 'robots', 'El build de pruebas debería bloquear el rastreo');
if (!existe.has('/.htaccess')) aviso('/.htaccess', 'hostinger', 'No se ha generado .htaccess');
const fotos = [];
for (const a of archivos) {
  if (!/\.(jpe?g|png|webp|avif|gif)$/i.test(a)) continue;
  const kb = statSync(a).size / 1024;
  if (kb > presupuesto.recursos_max_kb.imagen_individual) {
    fotos.push({ recurso: aUrl(a), kb });
    error(aUrl(a), 'peso-imagen', `${kb.toFixed(0)} KB (máx. ${presupuesto.recursos_max_kb.imagen_individual})`);
  }
  if (/\.(jpe?g|png)$/i.test(a)) aviso(aUrl(a), 'formato-imagen', 'Convierte a WebP o AVIF');
}
for (const t of negocio.pendientes ?? []) pendiente('src/data/negocio.yaml', 'negocio-pendiente', t);
if (estricto && !produccion) error('build', 'modo', 'El modo estricto es para el build de producción (INDEXAR=si)');

// ── 7. Informe ────────────────────────────────────────────────────────────────
const fecha = new Date().toISOString().slice(0, 10);
const salida = ruta('qa', fecha);
rmSync(salida, { recursive: true, force: true });
mkdirSync(join(salida, 'per-url'), { recursive: true });
const csv = (filas) =>
  filas.map((f) => f.map((c) => (/[",\n;]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(',')).join('\n') + '\n';
const kb = (b) => (b / 1024).toFixed(1);
const problemas = (u) => [...errores, ...avisos].filter((x) => x.url === u);
const maxSim = (u) => Math.max(0, ...duplicados.filter((d) => d.a === u || d.b === u).map((d) => d.sim));

writeFileSync(
  join(salida, 'summary.csv'),
  csv([
    ['url', 'tipo', 'title', 'title_len', 'meta_len', 'h1', 'palabras', 'faqs', 'enlaces_salientes', 'enlaces_entrantes', 'profundidad', 'html_kb', 'html_gzip_kb', 'similitud_max', 'palabras_propias', 'errores', 'avisos'],
    ...reales.map((p) => [
      p.url,
      p.tipo,
      p.title,
      p.title.length,
      p.meta.length,
      p.h1s[0] ?? '',
      p.palabras,
      p.faqs,
      p.salientes.size,
      p.entrantes,
      profundidad.get(p.url) ?? '',
      kb(p.bytes),
      kb(p.gzip),
      maxSim(p.url).toFixed(2),
      unicas.get(p.url) ?? '',
      errores.filter((x) => x.url === p.url).length,
      avisos.filter((x) => x.url === p.url).length,
    ]),
  ]),
);
writeFileSync(join(salida, 'broken-links.csv'), csv([['desde', 'hacia', 'texto'], ...rotos.map((r) => [r.desde, r.hacia, r.texto])]));
writeFileSync(
  join(salida, 'duplicate-content.csv'),
  csv([['url_a', 'url_b', 'similitud'], ...duplicados.sort((a, b) => b.sim - a.sim).map((d) => [d.a, d.b, d.sim.toFixed(3)])]),
);
writeFileSync(
  join(salida, 'lighthouse-budget-violations.csv'),
  csv([
    ['recurso', 'kb', 'limite_kb', 'regla'],
    ...errores.filter((e) => e.regla.startsWith('peso-')).map((e) => [e.url, e.detalle.match(/[\d.]+/)?.[0] ?? '', '', e.regla]),
  ]),
);
for (const p of reales) {
  const nombre = (p.url === '/' ? 'home' : p.url.replace(/^\/|\/$/g, '').replace(/\//g, '__')) + '.md';
  const lista = problemas(p.url);
  writeFileSync(
    join(salida, 'per-url', nombre),
    `# ${p.url}\n\n- Tipo: ${p.tipo || '—'}\n- Title (${p.title.length}): ${p.title}\n- Meta (${p.meta.length}): ${p.meta}\n- H1: ${p.h1s.join(' | ')}\n- Palabras: ${p.palabras} · Preguntas: ${p.faqs}\n- Enlaces: ${p.salientes.size} salientes, ${p.entrantes} entrantes · Profundidad: ${profundidad.get(p.url) ?? '—'}\n- Peso: ${kb(p.bytes)} KB (${kb(p.gzip)} KB comprimido) · CSS ${kb(p.css)} KB · JS ${kb(p.js)} KB\n- Schema: ${p.ld.map((n) => n['@type']).join(', ') || '—'}\n\n## Problemas\n\n${lista.length ? lista.map((x) => `- ${errores.includes(x) ? '❌' : '⚠️'} [${x.regla}] ${x.detalle}`).join('\n') : 'Ninguno ✅'}\n`,
  );
}
const agrupar = (lista) => {
  const g = new Map();
  for (const x of lista) g.set(x.regla, [...(g.get(x.regla) ?? []), x]);
  return [...g.entries()].map(([regla, xs]) => `### ${regla} (${xs.length})\n\n${xs.map((x) => `- \`${x.url}\` ${x.detalle}`).join('\n')}`).join('\n\n');
};
const tipos = TIPOS.map((t) => {
  const g = indexables.filter((p) => p.tipo === t);
  if (!g.length) return null;
  const media = (f) => Math.round(g.reduce((n, p) => n + f(p), 0) / g.length);
  return `| ${t} | ${g.length} | ${media((p) => p.palabras)} | ${media((p) => p.faqs)} | ${(Math.max(...g.map((p) => maxSim(p.url))) * 100).toFixed(0)} % | ${kb(Math.max(...g.map((p) => p.gzip)))} KB |`;
}).filter(Boolean);
writeFileSync(
  join(salida, 'REPORT.md'),
  `# Control de calidad · ${fecha}

Build: **${produccion ? 'producción (indexable)' : 'pruebas (noindex)'}** · Modo: **${estricto ? 'estricto' : 'normal'}**

| | |
|---|---|
| Páginas | ${reales.length} (${indexables.length} indexables, ${borradores.size} borradores) |
| Errores | ${errores.length} |
| Avisos | ${avisos.length} |

## Resultado: ${errores.length ? '❌ hay errores que corregir' : '✅ sin errores'}

## Por tipo de página

| Tipo | Páginas | Palabras (media) | Preguntas (media) | Similitud máx. | HTML comprimido máx. |
|---|---|---|---|---|---|
${tipos.join('\n')}

## Errores

${errores.length ? agrupar(errores) : 'Ninguno ✅'}

## Avisos

${avisos.length ? agrupar(avisos) : 'Ninguno ✅'}

## Archivos

- \`summary.csv\`: una fila por URL
- \`broken-links.csv\`, \`duplicate-content.csv\`, \`lighthouse-budget-violations.csv\`
- \`per-url/\`: detalle de cada página
`,
);

// Consola
const resumir = (lista, simbolo) => {
  const g = new Map();
  for (const x of lista) g.set(x.regla, (g.get(x.regla) ?? 0) + 1);
  return [...g.entries()].map(([r, n]) => `   ${simbolo} ${r}: ${n}`).join('\n');
};
console.log(`\nControl de calidad · ${reales.length} páginas · build de ${produccion ? 'producción' : 'pruebas'}${estricto ? ' · estricto' : ''}`);
console.log('─'.repeat(72));
if (errores.length) {
  console.log(`❌ ${errores.length} errores\n${resumir(errores, '•')}`);
  for (const e of errores.slice(0, 15)) console.log(`   ${e.url} [${e.regla}] ${e.detalle}`);
  if (errores.length > 15) console.log(`   … y ${errores.length - 15} más`);
} else console.log('✅ Sin errores');
if (avisos.length) console.log(`⚠️  ${avisos.length} avisos\n${resumir(avisos, '•')}`);
console.log(`\nInforme completo: qa/${fecha}/REPORT.md\n`);
process.exit(errores.length ? 1 : 0);
