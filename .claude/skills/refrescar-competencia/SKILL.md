---
name: refrescar-competencia
description: Volver a estudiar la competencia local (Google Maps, webs y velocidad) para actualizar las hipótesis SEO y el blueprint. Usar cada 3-6 meses o con "mira cómo está la competencia".
---

# Refrescar el estudio de competencia

Guarda todo en carpetas con la fecha (`AAAA-MM-DD`) para comparar con estudios anteriores.

1. **Local pack** (conector SEO_Personal → `places_buscar`): "empresa de reformas" y "reformas"
   en Murcia y en cada pueblo del url-map. Guarda cada búsqueda en
   `data/local-pack/reformas/{fecha}/raw/{pueblo}.json` (posición, nombre, categoría, nota, reseñas, web, localidad).
2. `node scripts/investigacion/consolidar-local-pack.mjs data/local-pack/reformas/{fecha}`
   → consolidated.csv y overlap-report.md.
3. **Webs**: de las 5-8 empresas mejor posicionadas, apunta en `data/web-patterns/reformas/{fecha}/matrix.csv`
   title, H1, servicios con URL propia, páginas por pueblo, FAQ, schema, CTA y WhatsApp.
4. **Velocidad** (SEO_Personal → `pagespeed`, móvil): LCP, CLS y nota → `pagespeed.csv`.
5. Compara con `data/patterns/reformas/2026-11-10/hypotheses.md` y escribe qué ha cambiado en
   `data/patterns/reformas/{fecha}/hypotheses.md`.
6. Propón al usuario (no apliques sin permiso) cambios en `url-map.yaml`: pueblos o servicios nuevos,
   priorizando donde la competencia sea floja.
