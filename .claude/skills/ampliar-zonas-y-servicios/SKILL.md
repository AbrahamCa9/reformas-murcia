---
name: ampliar-zonas-y-servicios
description: Añadir pueblos, servicios o páginas servicio × pueblo a la web con texto local real y sin crear doorway pages. Usar cuando pidan "añade el pueblo X", "crea páginas de Y en Z" o escribir un servicio en borrador.
---

# Ampliar pueblos y servicios

## 1. Decidir qué añadir

- Mira `blueprint/reformas-murcia/url-map.yaml` → `proximas_fases` y `data/patterns/.../hypotheses.md`
  (tabla de competencia por pueblo). Primero, donde la competencia es floja.
- Nunca más de ~10 páginas nuevas por tanda. El tope está en `limite_servicio_x_zona`.

## 2. Datos verificados del pueblo (si es nuevo)

1. Lee su artículo de Wikipedia en español (y, si hace falta, la web del ayuntamiento).
2. Anota en `data/zonas/AAAA-MM-DD-datos-verificados.md`, con la URL: población (INE y año), comarca,
   distancia a Murcia, límites, barrios, pedanías, urbanizaciones, tipo de vivienda, clima.
3. Lo que no esté en la fuente **no se escribe**.

## 3. Generar los borradores

1. Añade el slug en `url-map.yaml` (`zonas` y/o `servicio_x_zona`). Slugs de `src/data/municipios-region-murcia.yaml`.
2. `npm run generar` (informe) y `npm run generar -- --aplicar` (crea los `.md` con `pendiente: true`).

## 4. Escribir el texto

- **Zona** (`src/content/zonas/{pueblo}.md`): gancho de 40-60 caracteres, ayuntamiento, referencias,
  cercanas, ≥ 4 preguntas y 300-400 palabras: datos del pueblo, tipos de vivienda, trámites, clima.
- **Servicio × pueblo** (`src/content/landings/{servicio}/{pueblo}.md`): gancho ≤ 75 caracteres,
  ≥ 3 preguntas locales y 300-400 palabras **propias de esa combinación**: qué vivienda hay allí,
  qué se suele pedir de ese servicio, problemas típicos, trámites, logística.
  El primer H2 no repite el H1.
- **Servicio** (`src/content/servicios/{slug}.md`): resumen de 70-115 caracteres, ≥ 3 variantes,
  ≥ 3 factores de precio, ≥ 5 preguntas, ≥ 3 relacionados y 300+ palabras.
- Sin precios, plazos garantizados, años, reseñas ni certificados inventados. Normativa: con prudencia
  ("suele", "depende") y sin citar artículos que no hayas comprobado.
- Al terminar, borra `pendiente: true` y pon la fecha en `actualizado`.

## 5. Comprobar y entregar

1. `npm run verificar`. Si el QA da `similitud` o `palabras-unicas`, reescribe el texto local, no lo rellenes.
2. Commit en `borrador` y PR. Nunca a `main` sin "publícalo".
