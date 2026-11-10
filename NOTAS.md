# Notas y pendientes

Última actualización: 10/11/2026

## Estado

- Web completa en la rama `borrador`: 34 páginas, control de calidad sin errores.
- Lighthouse (móvil, local): rendimiento 100, accesibilidad 100, buenas prácticas 100. LCP 0,9 s.
  (El SEO marca 66 en pruebas solo porque la versión de pruebas lleva noindex a propósito.)
- Textos completos: home, reformas integrales, reforma de baños, reforma de cocinas, los 3 pueblos
  (Molina de Segura, Alcantarilla, Ceutí) y sus 9 páginas servicio × pueblo.
- Vista previa en Vercel (solo pruebas, siempre noindex): cada push a `borrador` crea una vista previa
  y Vercel deja el enlace en la PR. La versión de `main` sale con 404 hasta que se publique la web.
- 9 servicios en borrador (`pendiente: true`, noindex): cambio de bañera por plato de ducha, fachadas,
  instalaciones eléctricas, fontanería, garajes, locales y oficinas, pintura, pladur e impermeabilización.

## Pendiente antes de publicar (el despliegue no publica hasta resolverlo)

1. Decidir la marca y el dominio (hay una "Construcciones Carrasco" en el sector).
2. Escribir los 9 servicios en borrador.
3. Datos legales en `src/data/negocio.yaml` (titular, NIF, domicilio) y revisar los textos legales con un gestor.
4. Crear el email del dominio que recibe el formulario.
5. Revisar que garantías y proceso de `negocio.yaml` son ciertos.
6. "Sobre nosotros": quién está detrás, experiencia real, fotos del equipo.
7. Fotos reales de obras (ver `docs/prompts-imagenes.md`).
8. Hosting: Hostinger + secretos FTP en GitHub + variable `DEPLOY_ENABLED=true`.
9. Ficha de Google Business Profile con el mismo nombre, teléfono y web.

## Siguientes fases (url-map → proximas_fases)

- Fase 2: cambio de bañera y fachadas en los 3 pueblos; pueblos nuevos: Las Torres de Cotillas, Alguazas,
  Lorquí, Archena, Santomera.
- Fase 3: Cartagena, Lorca, San Javier, Torre Pacheco, Cieza, Totana.
