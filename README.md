# Web de reformas en Murcia

Web de una empresa de reformas en Murcia y pueblos de la región, hecha para gestionarse con agentes de IA.
La estructura sale de estudiar a la competencia y un control de calidad automático vigila cada página.

## Verla en tu ordenador

1. Instala Node 22.23.4 o superior.
2. `npm install`
3. `npm run dev` y abre http://localhost:4321

## Cambiar cosas sin tocar código

| Quiero cambiar… | Archivo |
|---|---|
| Teléfono, email, colores, garantías, datos legales | `src/data/negocio.yaml` |
| Qué servicios y pueblos tienen página | `blueprint/reformas-murcia/url-map.yaml` |
| El texto de un servicio, pueblo o página por pueblo | `src/content/` (Markdown) |

Después de cambiar algo: `npm run verificar`.

## Cómo se construyó

| Fase | Resultado |
|---|---|
| 1. Fichas de Google de la competencia | `data/local-pack/` |
| 2. Webs de la competencia y su velocidad | `data/web-patterns/` |
| 3. Patrones e hipótesis SEO | `data/patterns/` |
| 4. Blueprint (URLs, plantillas, schema, enlazado, presupuesto) | `blueprint/reformas-murcia/` |
| 5. Generación de páginas | `npm run generar` + `src/` |
| 6. Control de calidad | `npm run qa` → `qa/AAAA-MM-DD/` |

## Publicar

- **Pruebas:** importa el repo en Vercel (sale siempre con noindex).
- **Producción:** Hostinger. Se publica solo al hacer merge en `main` si existe la variable
  `DEPLOY_ENABLED=true` y los secretos `FTP_SERVER`, `FTP_USERNAME` y `FTP_PASSWORD`.
  No publica mientras quede algo en "pendientes" (ver `NOTAS.md`).
