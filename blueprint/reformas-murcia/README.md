# Blueprint · reformas en la Región de Murcia

> Fase 4 · skill `web-blueprint-generator` del repo de clase. Es el **plano** de la web: qué páginas
> hay, cómo se titulan, qué secciones llevan, qué schema y cómo se enlazan. La web (Astro) lee
> estos archivos al construirse, así que **cambiar el plano cambia la web**.

Entrada: [`data/patterns/reformas/2026-11-10/hypotheses.md`](../../data/patterns/reformas/2026-11-10/hypotheses.md).

| Archivo | Para qué sirve | Quién lo usa |
|---|---|---|
| `url-map.yaml` | Qué páginas existen (servicios, pueblos, servicio × pueblo) | Web, `npm run generar`, `npm run qa` |
| `page-templates/*.md` | Title, meta description, H1, orden de secciones, schema y mínimos de cada tipo de página | Web y QA |
| `schema-templates/*.jsonld` | Contrato de datos estructurados por tipo de página | QA (comprueba que el JSON-LD real lo cumple) |
| `internal-linking.yaml` | Reglas de enlazado interno | Web y QA |
| `lighthouse-budget.json` | Presupuesto de velocidad heredado de la competencia | QA y Lighthouse CI |

## Tipos de página

| Tipo | URL | Ejemplo |
|---|---|---|
| home | `/` | Empresa de reformas en Murcia |
| service-pillar | `/servicios/{servicio}/` | Reforma de baños en Murcia |
| service-area | `/{servicio}/{pueblo}/` | Reforma de baños en Molina de Segura |
| area-hub | `/zonas/{pueblo}/` | Empresa de reformas en Ceutí |

## Variables de los patrones

`{marca}` `{ciudad}` `{provincia}` `{region}` `{telefono}` `{servicio}` `{servicio_corto}` `{resumen}`
`{zona}` `{gancho}` `{servicio_slug}` `{zona_slug}`.

Si un title pasa de 65 caracteres, la web quita automáticamente `| {marca}` para que no se corte en Google.

## Cambios respecto a la skill original

- **Hub por pueblo** (`area-hub`): añadido porque el n.º 1 de Molina de Segura y los directorios trabajan páginas por pueblo.
- **`areaServed`** usa `City` en vez de `PostalAddress`: schema.org no admite `PostalAddress` en `areaServed`.
- **Fuente de verdad de zonas**: los `.md` de `src/content/zonas/` (no un `areas-served.json`), para que se editen como texto.
