---
name: qa-web
description: Pasar e interpretar el control de calidad de la web (npm run qa) y arreglar lo que salga, también la issue de mantenimiento semanal. Usar con "revisa la web", "pasa el QA" o "revisa la issue de mantenimiento".
---

# Control de calidad

1. `npm run verificar` (o `INDEXAR=si npm run build && npm run qa -- --estricto` para simular producción).
2. Lee `qa/AAAA-MM-DD/REPORT.md`. Detalle por URL en `per-url/` y tablas en los `.csv`.

## Qué significa cada regla y cómo se arregla

| Regla | Arreglo |
|---|---|
| `pagina-falta` | `npm run generar -- --aplicar` y escribir el texto |
| `title`, `meta`, `h1`, `*-duplicado` | Patrones en `page-templates/` o el gancho/resumen del `.md` |
| `canonical`, `robots`, `sitemap` | Revisa `src/layouts/Base.astro` y `astro.config.mjs`; no los toques sin entenderlos |
| `schema-contrato` | Compara el JSON-LD con `schema-templates/{tipo}.jsonld` y ajusta `src/lib/schema.ts` |
| `enlace-roto`, `ancla`, `huerfana`, `profundidad`, `enlazado` | Enlaces del Markdown o de las páginas; reglas en `internal-linking.yaml` |
| `palabras`, `faq`, `palabras-unicas`, `similitud` | Más texto **local y útil** en el `.md`; nunca relleno |
| `nap` | El teléfono sale de `negocio.yaml`; no lo escribas a mano en los textos |
| `peso-*` | Imágenes en WebP ≤ 200 KB; nada de librerías JS |
| `borrador`, `texto-pendiente`, `negocio-pendiente` | Tareas para el usuario o para escribir; bloquean la publicación |

3. Arregla, vuelve a pasar el QA y haz commit en `borrador`.
4. Si vienes de la issue semanal, comenta en ella qué se arregló y qué necesita al usuario.
