#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Generador de páginas (Fase 5 del flujo: blueprint → páginas)
//
//   npm run generar                → informe: qué páginas pide el url-map y qué texto falta
//   npm run generar -- --aplicar   → crea los borradores que faltan (`pendiente: true`)
//
// Los borradores compilan, pero salen con noindex, fuera del sitemap y el QA estricto
// no deja publicarlos hasta que alguien (el agente o tú) escriba el texto real.
// Nunca sobrescribe un archivo que ya existe.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { leerUrlMap, leerYaml, paresServicioZona, ruta, leerFrontmatter } from '../src/lib/datos-base.mjs';

const aplicar = process.argv.includes('--aplicar');
const urlMap = leerUrlMap();
const pares = paresServicioZona(urlMap);
const municipios = leerYaml('src/data/municipios-region-murcia.yaml').municipios ?? [];
const hoy = new Date().toISOString().slice(0, 10);

const nombreMunicipio = (slug) =>
  municipios.find((m) => m.slug === slug)?.nombre ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
const nombreServicio = (slug) => {
  const rel = `src/content/servicios/${slug}.md`;
  if (existsSync(ruta(rel))) return leerFrontmatter(rel).nombre ?? slug;
  return slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
};
const q = (s) => JSON.stringify(s);
const P = '[PENDIENTE]';

// ── Plantillas de borrador ────────────────────────────────────────────────────
const faqs = (n, clave = 'faqs') =>
  `${clave}:\n` +
  Array.from(
    { length: n },
    (_, i) =>
      `  - pregunta: ${q(`${P} ¿Pregunta frecuente ${i + 1}?`)}\n    respuesta: ${q(`${P} Respuesta clara y comprobable, sin inventar precios, plazos ni datos.`)}`,
  ).join('\n');

const borradorServicio = (slug) => {
  const otros = urlMap.servicios.filter((s) => s !== slug).slice(0, 3);
  return `---
nombre: ${q(nombreServicio(slug))}
resumen: ${q(`${P} Resumen de 70 a 120 caracteres para las tarjetas y la meta description.`)}
icono: casa
titulo_variantes: "Qué incluye este servicio"
variantes:
${[1, 2, 3].map((i) => `  - titulo: ${q(`${P} Tipo de trabajo ${i}`)}\n    texto: ${q(`${P} En qué consiste, cuándo conviene y qué incluye.`)}`).join('\n')}
titulo_precio: "Qué influye en el precio en {zona}"
factores_precio:
${[1, 2, 3].map((i) => `  - ${q(`${P} Factor de precio ${i}`)}`).join('\n')}
${faqs(5)}
relacionados: [${otros.join(', ')}]
pendiente: true
actualizado: ${hoy}
---

## ${P} Qué es y para quién

Explica el servicio con tus palabras: qué problema resuelve, qué incluye y cómo lo hacéis.
Mínimo 300 palabras en total en la página. Sin precios inventados ni datos sin fuente.
`;
};

const borradorZona = (slug) => `---
nombre: ${q(nombreMunicipio(slug))}
comarca: ""
gancho: ${q(`${P} Frase local de 40 a 90 caracteres sobre ${nombreMunicipio(slug)}.`)}
ayuntamiento: ${q(`Ayuntamiento de ${nombreMunicipio(slug)}`)}
referencias: []
cercanas: []
${faqs(4)}
fuentes: []
pendiente: true
actualizado: ${hoy}
---

## ${P} Reformas en ${nombreMunicipio(slug)}

Texto local verificado (anota las fuentes en \`fuentes\` y en data/zonas/):
tipo de vivienda, barrios y pedanías, trámites con el ayuntamiento, cómo trabajáis allí.
`;

const borradorLanding = (servicio, zona) => `---
gancho: ${q(`${P} Frase de 40 a 90 caracteres: ${nombreServicio(servicio).toLowerCase()} en ${nombreMunicipio(zona)}.`)}
${faqs(3, 'faqs_locales')}
pendiente: true
actualizado: ${hoy}
---

## ${P} ${nombreServicio(servicio)} en ${nombreMunicipio(zona)}

Texto propio de esta combinación (mínimo 150 palabras que no se repitan en otras páginas):
viviendas típicas del pueblo, qué se suele pedir allí, permisos del ayuntamiento, cómo organizáis la obra.
`;

// ── Qué pide el url-map y qué existe ──────────────────────────────────────────
const tareas = [
  ...urlMap.servicios.map((s) => ({ tipo: 'servicio', url: `/servicios/${s}/`, archivo: `src/content/servicios/${s}.md`, crear: () => borradorServicio(s) })),
  ...(urlMap.zonas ?? []).map((z) => ({ tipo: 'zona', url: `/zonas/${z}/`, archivo: `src/content/zonas/${z}.md`, crear: () => borradorZona(z) })),
  ...pares.map(({ servicio, zona }) => ({
    tipo: 'servicio × pueblo',
    url: `/${servicio}/${zona}/`,
    archivo: `src/content/landings/${servicio}/${zona}.md`,
    crear: () => borradorLanding(servicio, zona),
  })),
];

const errores = [];
for (const { servicio, zona } of pares) {
  if (!urlMap.servicios.includes(servicio)) errores.push(`servicio_x_zona usa "${servicio}", que no está en "servicios".`);
  if (!(urlMap.zonas ?? []).includes(zona)) errores.push(`servicio_x_zona usa la zona "${zona}", que no está en "zonas".`);
}
for (const z of urlMap.zonas ?? []) {
  if (!municipios.some((m) => m.slug === z)) errores.push(`La zona "${z}" no está en src/data/municipios-region-murcia.yaml (¿slug mal escrito?).`);
}

const faltan = tareas.filter((t) => !existsSync(ruta(t.archivo)));
const borradores = tareas.filter((t) => existsSync(ruta(t.archivo)) && leerFrontmatter(t.archivo).pendiente === true);

// Contenido que existe pero el url-map ya no pide (no se publica)
const sobrantes = [];
const listar = (dir) => (existsSync(ruta(dir)) ? readdirSync(ruta(dir)) : []);
for (const f of listar('src/content/servicios')) if (f.endsWith('.md') && !urlMap.servicios.includes(f.slice(0, -3))) sobrantes.push(`src/content/servicios/${f}`);
for (const f of listar('src/content/zonas')) if (f.endsWith('.md') && !(urlMap.zonas ?? []).includes(f.slice(0, -3))) sobrantes.push(`src/content/zonas/${f}`);
for (const s of listar('src/content/landings')) {
  for (const f of listar(`src/content/landings/${s}`)) {
    if (f.endsWith('.md') && !pares.some((p) => p.servicio === s && `${p.zona}.md` === f)) sobrantes.push(`src/content/landings/${s}/${f}`);
  }
}

// ── Informe ───────────────────────────────────────────────────────────────────
const total = 1 + 2 + urlMap.servicios.length + (urlMap.zonas ?? []).length + pares.length + (urlMap.paginas ?? []).length + (urlMap.legales ?? []).length;
console.log('\nGenerador de páginas · url-map:', `blueprint/.../url-map.yaml`);
console.log('─'.repeat(72));
console.log(`Servicios (pilar):        ${urlMap.servicios.length}`);
console.log(`Pueblos (hub):            ${(urlMap.zonas ?? []).length}`);
console.log(`Servicio × pueblo:        ${pares.length} de ${urlMap.limite_servicio_x_zona} como máximo`);
console.log(`Páginas totales aprox.:   ${total} (incluye inicio, listados, contacto y legales)`);
console.log('─'.repeat(72));

if (errores.length) {
  console.log('\n❌ Errores en el url-map:');
  for (const e of errores) console.log('   -', e);
}
if (pares.length > urlMap.limite_servicio_x_zona) {
  console.log(`\n❌ Hay ${pares.length} páginas servicio × pueblo y el tope es ${urlMap.limite_servicio_x_zona}. No se genera nada.`);
  process.exit(1);
}
if (pares.length > urlMap.limite_servicio_x_zona * 0.8) {
  console.log(`\n⚠️  Te acercas al tope de páginas servicio × pueblo (${pares.length}/${urlMap.limite_servicio_x_zona}).`);
}

if (faltan.length === 0) {
  console.log('\n✅ Todo el contenido que pide el url-map existe.');
} else {
  console.log(`\n${aplicar ? '📝 Creando' : '🔎 Faltan'} ${faltan.length} archivos de contenido:`);
  for (const t of faltan) console.log(`   - [${t.tipo}] ${t.url}  →  ${t.archivo}`);
}
if (borradores.length) {
  console.log(`\n⏳ Borradores pendientes de escribir (${borradores.length}):`);
  for (const t of borradores) console.log(`   - ${t.archivo}`);
}
if (sobrantes.length) {
  console.log('\nℹ️  Contenido que el url-map ya no pide (no se publica; si cambiaste un slug, añade una 301 en src/data/redirecciones.yaml):');
  for (const f of sobrantes) console.log('   -', f);
}

if (errores.length) process.exit(1);

if (aplicar && faltan.length) {
  for (const t of faltan) {
    const destino = ruta(t.archivo);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, t.crear(), { flag: 'wx' });
  }
  console.log(`\n✅ Creados ${faltan.length} borradores con "pendiente: true".`);
}

if (faltan.length || borradores.length) {
  console.log(`
Siguientes pasos:
  1. ${aplicar || !faltan.length ? 'Escribe' : 'Ejecuta `npm run generar -- --aplicar` y escribe'} el texto de cada borrador
     (guía: .claude/skills/ampliar-zonas-y-servicios/SKILL.md). Quita "pendiente: true" al terminar.
  2. npm run verificar   (comprueba tipos, compila y pasa el control de calidad)
`);
}
