#!/usr/bin/env node
// Fase 1 · local-pack-multi-city (versión ligera).
// Lee data/local-pack/{kw}/{fecha}/raw/*.json (una búsqueda de Google Maps por localidad)
// y genera consolidated.json, consolidated.csv y overlap-report.md en la misma carpeta.
//
// Uso: node scripts/investigacion/consolidar-local-pack.mjs data/local-pack/reformas/2026-11-10
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const carpeta = process.argv[2];
if (!carpeta) {
  console.error('Uso: node scripts/investigacion/consolidar-local-pack.mjs <carpeta-con-raw>');
  process.exit(1);
}

const rawDir = join(carpeta, 'raw');
const ficheros = readdirSync(rawDir).filter((f) => f.endsWith('.json')).sort();
const negocios = new Map();

const clave = (r) => (r.web && r.web.startsWith('http') ? new URL(r.web).hostname.replace(/^www\./, '') : r.nombre.toLowerCase());

for (const fichero of ficheros) {
  const localidad = basename(fichero, '.json');
  const datos = JSON.parse(readFileSync(join(rawDir, fichero), 'utf8'));
  for (const r of datos.resultados) {
    const id = clave(r);
    const n = negocios.get(id) ?? {
      id,
      nombre: r.nombre,
      dominio: r.web && r.web.startsWith('http') ? new URL(r.web).hostname.replace(/^www\./, '') : null,
      url_ficha: r.web ?? null,
      categoria: r.categoria,
      localidad_ficha: r.localidad,
      valoracion: r.valoracion,
      resenas: r.resenas ?? 0,
      busquedas: [],
    };
    n.busquedas.push({ localidad, posicion: r.posicion });
    negocios.set(id, n);
  }
}

const lista = [...negocios.values()].sort((a, b) => (b.resenas ?? 0) - (a.resenas ?? 0));
writeFileSync(join(carpeta, 'consolidated.json'), JSON.stringify(lista, null, 1) + '\n');

const csv = ['nombre,dominio,categoria,localidad_ficha,valoracion,resenas,apariciones,mejor_posicion,url_ficha_es_landing'];
for (const n of lista) {
  const mejor = Math.min(...n.busquedas.map((b) => b.posicion));
  const esLanding = n.url_ficha ? new URL(n.url_ficha.startsWith('http') ? n.url_ficha : 'http://x').pathname.length > 1 : false;
  csv.push(
    [n.nombre, n.dominio ?? '', n.categoria, n.localidad_ficha, n.valoracion ?? '', n.resenas, n.busquedas.length, mejor, esLanding ? 'si' : 'no']
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(','),
  );
}
writeFileSync(join(carpeta, 'consolidated.csv'), csv.join('\n') + '\n');

// Informe de solapamiento y señales básicas
const multi = lista.filter((n) => n.busquedas.length > 1);
const conWeb = lista.filter((n) => n.dominio);
const landing = lista.filter((n) => n.url_ficha && n.url_ficha.startsWith('http') && new URL(n.url_ficha).pathname.length > 1);
const porLocalidad = ficheros.map((f) => {
  const loc = basename(f, '.json');
  const d = JSON.parse(readFileSync(join(rawDir, f), 'utf8'));
  const res = d.resultados.map((r) => r.resenas ?? 0).sort((a, b) => b - a);
  const top3 = res.slice(0, 3);
  return { loc, consulta: d.consulta, n: d.resultados.length, max: res[0] ?? 0, mediana: res[Math.floor(res.length / 2)] ?? 0, top3 };
});

const md = [
  `# Informe de solapamiento · ${basename(carpeta)}`,
  '',
  `Negocios únicos: **${lista.length}** · con web: **${conWeb.length}** · aparecen en más de una búsqueda: **${multi.length}**.`,
  '',
  '## Competencia por localidad (reseñas en Google)',
  '',
  '| Localidad | Consulta | Fichas | Máx. reseñas | Mediana | Top 3 (reseñas) |',
  '|---|---|---:|---:|---:|---|',
  ...porLocalidad.map((p) => `| ${p.loc} | ${p.consulta} | ${p.n} | ${p.max} | ${p.mediana} | ${p.top3.join(' · ')} |`),
  '',
  '## Negocios en varias búsquedas',
  '',
  ...(multi.length ? multi.map((n) => `- ${n.nombre} (${n.busquedas.map((b) => `${b.localidad} #${b.posicion}`).join(', ')})`) : ['- Ninguno']),
  '',
  '## Fichas que enlazan a una landing de servicio + ciudad (no a la home)',
  '',
  ...(landing.length ? landing.map((n) => `- ${n.nombre} → ${n.url_ficha}`) : ['- Ninguna']),
  '',
];
writeFileSync(join(carpeta, 'overlap-report.md'), md.join('\n'));
console.log(`OK · ${lista.length} negocios únicos → ${carpeta}`);
