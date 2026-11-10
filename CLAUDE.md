# Web de reformas en Murcia · instrucciones para Claude

Web de una empresa de reformas (marca provisional "Reformas Carrasco") que se gestiona sola con agentes:
la estructura sale de estudiar a la competencia, el contenido vive en Markdown y un control de calidad
automático impide publicar páginas flojas.

- Repo: AbrahamCa9/reformas-murcia · rama de trabajo: `borrador`
- Pruebas: Vercel (siempre noindex) · Producción: Hostinger por FTP desde GitHub Actions
- Stack: Astro 7 (estático), sin JavaScript de terceros, CSS propio. Node 22.23.4+ (`.node-version`).

## Reglas que no se rompen

1. **Nunca** hagas push a `main`, merge a `main` ni publiques nada sin que el usuario diga "publícalo" o "súbelo".
   Trabaja en `borrador`, haz commit y abre o actualiza la PR.
2. **No inventes datos**: ni precios, ni años de experiencia, ni reseñas, ni certificados, ni datos de pueblos.
   Lo local sale de `data/zonas/` (con fuente). Si falta un dato, se escribe el texto sin él.
3. **Cada página servicio × pueblo lleva texto propio** (≥ 150 palabras que no estén en otras, similitud < 70 %).
   Nada de plantillas con el nombre del pueblo cambiado: es lo que Google castiga como "doorway pages".
4. Antes de cada commit: `npm run verificar` (tipos + build + QA). Si falla, no se sube.
5. Responde al usuario en español, en pasos cortos y numerados (tiene TDAH: una idea por bloque).
6. Al terminar una sesión, avisa si quedan commits sin subir.
7. **Secretos** (FTP, token de Telegram): solo en GitHub → Settings → Secrets and variables → Actions.
   Nunca en el repo (es público), ni en la memoria, ni en Vercel (Vercel serviría `api/config.php` como texto).

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Datos del negocio (NAP, colores, garantías, proceso, legales, pendientes) | `src/data/negocio.yaml` |
| Qué páginas existen (servicios, pueblos, combinaciones) | `blueprint/reformas-murcia/url-map.yaml` |
| Title, meta, H1, orden de secciones y mínimos por tipo | `blueprint/reformas-murcia/page-templates/*.md` |
| Contrato de datos estructurados | `blueprint/reformas-murcia/schema-templates/*.jsonld` |
| Reglas de enlazado interno y presupuesto de velocidad | `blueprint/reformas-murcia/internal-linking.yaml`, `lighthouse-budget.json` |
| Textos | `src/content/servicios/`, `zonas/`, `landings/{servicio}/{pueblo}.md`, `paginas/` |
| Fotos (origen y alt) | `data/fotos.yaml` → `src/assets/fotos/`; se asignan con el campo `foto` del contenido |
| Datos verificados de pueblos | `data/zonas/` |
| Investigación de competencia (Fases 1-3) | `data/local-pack/`, `data/web-patterns/`, `data/patterns/` |
| Formulario (PHP para Hostinger) | `public/api/contacto.php` (+ `api/config.php` que genera el build) |
| Avisos por Telegram (presupuestos, publicación, revisión semanal) | secretos `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` → `src/lib/telegram.mjs`, `scripts/avisar-telegram.mjs`; prueba: workflow «Probar Telegram» |
| .htaccess (HTTPS, 301, caché) | lo genera `integrations/hostinger.mjs` en cada build |

## Comandos

```bash
npm run dev                      # vista previa en http://localhost:4321
npm run generar                  # qué páginas pide el url-map y qué texto falta
npm run generar -- --aplicar     # crea borradores (pendiente: true) de lo que falta
npm run verificar                # astro check + build + QA
npm run qa -- --estricto         # como el despliegue: falla si queda algo pendiente
INDEXAR=si npm run build         # build de producción (indexable)
```

## Tareas habituales (skills del proyecto)

- Añadir pueblos o servicios → `.claude/skills/ampliar-zonas-y-servicios/SKILL.md`
- Revisar el control de calidad o la issue semanal → `.claude/skills/qa-web/SKILL.md`
- Volver a estudiar la competencia → `.claude/skills/refrescar-competencia/SKILL.md`
- Fotos de ambiente: se generan con el fal.ai del usuario (modelo más barato, `fal-ai/z-image/turbo`, ~1 céntimo;
  di el coste antes de generar lotes), se apuntan en `data/fotos.yaml` y el workflow "Importar fotos" las baja
  a `src/assets/fotos/` (este entorno no puede descargar de fal.media). Las de trabajos realizados, siempre reales.
  Prompts de referencia: `docs/prompts-imagenes.md`.

## Cómo funciona la indexación

Solo el build con `INDEXAR=si` (el de Hostinger) es indexable. Vercel y local salen con `noindex`,
`robots.txt` bloqueado y cabecera `X-Robots-Tag` (vercel.json). Los borradores (`pendiente: true`)
salen siempre con noindex y fuera del sitemap, y el despliegue no deja publicar mientras existan.

Estado y pendientes: `NOTAS.md`.
