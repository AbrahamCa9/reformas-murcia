---
tipo: service-area
url: /{servicio_slug}/{zona_slug}/
title: "{servicio} en {zona} | {marca}"
meta_description: "{servicio} en {zona} ({provincia}). {gancho} Presupuesto gratis y sin compromiso: {telefono}."
h1: "{servicio} en {zona}"
secciones: [hero, contenido-local, por-que-nosotros, proceso, precio, faq, otras-zonas, otros-servicios-zona, cta-final]
schema: [Service, BreadcrumbList, FAQPage]
palabras_min: 450
palabras_unicas_min: 150
similitud_max: 0.7
faq_min: 6
---

# Plantilla · Servicio × pueblo

**Objetivo:** posicionar "{servicio} en {zona}". Es el hueco que hoy solo ocupan directorios con
texto plantilla (hipótesis 7). Aquí gana quien tiene **texto local real**.

Reglas de contenido (las comprueba `npm run qa`):
- Texto propio de la combinación en `src/content/landings/{servicio}--{zona}.md` (≥ 150 palabras únicas).
- Similitud con sus páginas hermanas < 0,7 (Jaccard).
- ≥ 6 preguntas: las del servicio + las locales de la combinación.
- ≥ 3 enlaces a otros pueblos del mismo servicio (o todos si hay menos), 1 al pilar y 1 al hub del pueblo.

| Sección | Qué lleva | Hipótesis |
|---|---|---|
| hero | H1 servicio + pueblo, gancho local, CTA | 1, 4 |
| contenido-local | Cuerpo del Markdown de la landing | 7 |
| por-que-nosotros | Garantías reales | 14 |
| proceso | 5 pasos, con el permiso del ayuntamiento del pueblo | 9 |
| precio | Factores de precio | 10 |
| faq | Servicio + locales, `FAQPage` | 8 |
| otras-zonas | El mismo servicio en otros pueblos | 7 |
| otros-servicios-zona | Otros servicios en este pueblo o sus pilares | 3 |
| cta-final | Llamar, WhatsApp, formulario | 4, 5 |
