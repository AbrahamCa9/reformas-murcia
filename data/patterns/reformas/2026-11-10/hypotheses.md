# Hipótesis priorizadas · empresa de reformas × Murcia, Alcantarilla, Molina de Segura y Ceutí

> Fase 3 · `local-seo-pattern-aggregator`. Fecha del análisis: **2026-11-10**.
> Entrada: `data/local-pack/reformas/2026-11-10/` (Google Maps, 4 búsquedas, 48 negocios únicos) y
> `data/web-patterns/reformas/2026-11-10/` (5 webs de negocio + 2 directorios + PageSpeed móvil).

## ⚠️ Antes de leer

- **Muestra pequeña.** Grupo A (ganadores) = 3 webs legibles con más de 60 reseñas (Creativa, Concamar, Reformas Martínez). Grupo B = 2 (Aedes 5.0, Habitapro). Jogris no se pudo leer.
- Con menos de 5 webs por grupo **no hay significación estadística**. Son hipótesis de trabajo para decidir la estructura, no leyes de Google.
- "El top tiene X" no significa que X cause el ranking. Lenguaje correcto: *"los que posicionan comparten X"*.
- Repetir con más datos cada 1-3 meses (skill `refrescar-competencia`).

## Nivel de competencia por localidad

| Localidad | Fichas | Máx. reseñas | Mediana | Lectura |
|---|---:|---:|---:|---|
| Murcia | 20 | 90 | 18 | Alta. Atacar con páginas pilar y velocidad. |
| Alcantarilla | 10 | 73 | 18 | Media-alta. Dos negocios dominan (Concamar, Martínez). |
| Molina de Segura | 9 | 12 | 4 | **Baja.** Oportunidad clara. |
| Ceutí | 10 | 19* | 6 | **Muy baja.** No hay empresas de reformas fuertes en el pueblo (*los primeros son obra civil). |

## Hipótesis (HIGH · easy primero)

1. **[HIGH · easy] Palabra clave + ciudad en title y H1.**
   3/3 del grupo A llevan servicio + ciudad en el title; 2/3 también en el H1 (Martínez usa un H1 emocional). 2/2 en el grupo B.
   → **Blueprint:** H1 = `{servicio} en {ciudad}` en todas las plantillas; title = `{servicio} en {ciudad} | {marca}`.

2. **[HIGH · easy] La ficha de Google enlaza a una página de servicio + ciudad.**
   2 de las 3 fichas ganadoras no enlazan a la home sino a `/reformas_integrales_murcia/` y `/empresa-de-reformas-en-murcia/`.
   → **Blueprint:** la home se orienta a "empresa de reformas en Murcia" y es la URL que irá en la ficha de Google.

3. **[HIGH · easy] Cada servicio tiene su propia URL.**
   4/5 webs (Martínez, Concamar, Aedes con 7 servicios, Habitapro).
   → **Blueprint:** una página pilar por servicio en `/servicios/{servicio}/` (12 servicios).

4. **[HIGH · easy] CTA "presupuesto gratis y sin compromiso".**
   5/5 webs. Concamar lo lleva incluso en el title.
   → **Blueprint:** CTA principal "Pide presupuesto gratis" y mención en la meta description.

5. **[HIGH · easy] Contacto inmediato: teléfono arriba, WhatsApp y barra fija.**
   Teléfono en cabecera 3/5; WhatsApp 2/5; barra fija Llamar / WhatsApp / Presupuesto solo en Martínez, que es la web más rápida y la de mejor nota.
   → **Blueprint:** teléfono en cabecera + barra fija en móvil con las 3 acciones en todas las páginas.

6. **[HIGH · easy] La competencia es lenta en móvil.**
   Rendimiento móvil 40-88; LCP entre 3,4 s (Martínez) y 32,3 s (Creativa). Mediana de LCP: 7,5 s.
   → **Blueprint:** `lighthouse-budget.json` con rendimiento ≥ 90, LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms. Ventaja fácil y medible.

7. **[HIGH · medium] Nadie tiene páginas servicio × pueblo con contenido real.**
   Ninguna web de negocio tiene páginas servicio × pueblo; solo Habitapro tiene 3 páginas por pueblo y Concamar lista 15 zonas sin enlace. Las que posicionan con ese patrón son los **directorios** (Habitissimo, Cronoshare), con 40-150 palabras de texto plantilla.
   → **Blueprint:** páginas `/{servicio}/{pueblo}/` con texto local real (≥ 150 palabras únicas por página) + una página hub por pueblo en `/zonas/{pueblo}/`. Es el hueco más claro.

8. **[MEDIUM · easy] FAQ casi inexistente.**
   1/5 webs (Concamar, 7 preguntas: precio, plazos, licencias, interlocutor único, qué incluye el presupuesto, vivir en casa durante la obra y ayudas). 0/2 directorios.
   → **Blueprint:** FAQ en todas las páginas de servicio y pueblo (≥ 6 preguntas en servicio × pueblo) con `FAQPage`.

9. **[MEDIUM · easy] Proceso explicado por pasos.**
   3/5 webs (Concamar 5 pasos; Martínez y Habitapro 4).
   → **Blueprint:** sección de proceso en 5 pasos: visita, presupuesto, permisos, obra, entrega.

10. **[MEDIUM · easy] Orientación de precio.**
    Concamar (ejemplo de presupuesto), Cronoshare (mínimo/medio/máximo por pueblo), Habitapro (calculadora).
    → **Blueprint:** bloque "¿Cuánto cuesta?" con los factores que mueven el precio. Cifras solo cuando el negocio defina las suyas (campo `precio_orientativo` en los datos). No se inventan precios.

11. **[MEDIUM · easy] Migas de pan.**
    0/5 webs de negocio; 2/2 directorios.
    → **Blueprint:** breadcrumbs visibles + `BreadcrumbList` en todas las páginas internas.

12. **[MEDIUM · hard] Reseñas.**
    El grupo A tiene 67-90 reseñas y Martínez las enseña en la web (nota + testimonios).
    → **No replicable a corto plazo.** El bloque de reseñas existe pero solo se muestra con reseñas reales. Acción de negocio: pedir reseña al terminar cada obra.

13. **[MEDIUM · medium] Fotos de obras reales y antes/después.**
    4/5 webs.
    → **Blueprint:** galería y antes/después cuando haya fotos propias. Nunca fotos de obras inventadas.

14. **[LOW · easy] Años de experiencia y certificaciones.**
    Concamar (+30 años, ISO), Creativa (+20 años).
    → Mostrar solo si son reales (campos en `negocio.yaml`, vacíos por defecto).

15. **[LOW · easy] Ayudas y subvenciones.**
    2/5 lo mencionan (Concamar FAQ + guía; Aedes, aviso MOVES III).
    → Pregunta FAQ sobre ayudas, sin cifras ni convocatorias concretas que caduquen.

## Señales que NO replicamos

- **Nombre de ficha con palabras clave** ("CYMENTO - Construcción y Reformas en Murcia", "URBALIX Empresa reformas Murcia", "⭐Reformas integrales Murcia - Habitapro"). Va contra las directrices de Google Business Profile.
- **Texto plantilla con el pueblo cambiado** (directorios). Riesgo de contenido duplicado y de "doorway pages".
- **Varios H1 por página** (Creativa).

## Sin conclusión posible

- **Schema JSON-LD:** no se puede ver con la extracción a texto. No sabemos si lo usan. Lo implementamos completo igualmente (coste bajo).

## Servicios que ofrece la competencia (unión)

Reformas integrales (pisos, casas, chalés), baños, cocinas, locales y oficinas, naves, exteriores (fachadas, terrazas, patios, cerramientos), rehabilitación de edificios, albañilería, fontanería, electricidad, cerrajería, carpintería de aluminio y de madera, pintura, pladur, suelo radiante, aerotermia, proyectos de arquitectura, interiorismo, home staging. En baños, los directorios separan además: cambiar bañera por plato de ducha, alicatar, adaptar el baño y reformar sin obras.

→ **Catálogo elegido (12 páginas pilar):** reformas integrales, reforma de baños, reforma de cocinas, cambio de bañera por plato de ducha, reforma de fachadas, instalaciones eléctricas, fontanería, reforma de garajes, reforma de locales y oficinas, pintura, pladur y falsos techos, impermeabilización de cubiertas y terrazas.

## Siguiente paso

Estas hipótesis HIGH alimentan `blueprint/reformas-murcia/` (Fase 4 · `web-blueprint-generator`).
