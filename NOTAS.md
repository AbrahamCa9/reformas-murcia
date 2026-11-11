# Notas y pendientes

Última actualización: 11/11/2026

## Estado

- Web completa en la rama `borrador`: 34 páginas, control de calidad sin errores.
- Lighthouse (móvil, local): rendimiento 100, accesibilidad 100, buenas prácticas 100. LCP 0,9 s.
  (El SEO marca 66 en pruebas solo porque la versión de pruebas lleva noindex a propósito.)
- Textos completos: home, reformas integrales, reforma de baños, reforma de cocinas, los 3 pueblos
  (Molina de Segura, Alcantarilla, Ceutí) y sus 9 páginas servicio × pueblo.
- Vista previa en Vercel (solo pruebas, siempre noindex): cada push a `borrador` crea una vista previa
  y Vercel deja el enlace en la PR. La versión de `main` sale con 404 hasta que se publique la web.
- Los 12 servicios tienen texto completo (los 9 que estaban en borrador se escribieron el 11/11/2026).

## Pendiente antes de publicar (el despliegue no publica hasta resolverlo)

1. Decidir la marca y el dominio (hay una "Construcciones Carrasco" en el sector).
2. Datos legales en `src/data/negocio.yaml` (titular, NIF, domicilio) y revisar los textos legales con un gestor.
3. Crear el email del dominio que recibe el formulario.
4. Revisar que garantías y proceso de `negocio.yaml` son ciertos.
5. "Sobre nosotros": quién está detrás, experiencia real, fotos del equipo.
6. Fotos reales de obras (ver `docs/prompts-imagenes.md`).
7. Hosting: Hostinger + secretos FTP en GitHub + variable `DEPLOY_ENABLED=true`.
8. Ficha de Google Business Profile con el mismo nombre, teléfono y web.

## Demo en Vercel con formulario a Telegram

En Vercel el formulario va a `api/presupuesto.js` y manda el aviso por Telegram (sin correo).
Para que funcione:

1. Vercel → proyecto → Settings → Environment Variables: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`
   (marca Preview y Production) y vuelve a desplegar.
2. Para tener un enlace fijo y abierto como el del profesor: Settings → Environments → Production →
   Branch Tracking, rama `borrador`. Así `reformas-murcia.vercel.app` muestra la demo (siempre con noindex).
3. Si el enlace pide iniciar sesión en Vercel: Settings → Deployment Protection → Vercel Authentication desactivado.

## Telegram (opcional, ya programado)

Cada presupuesto del formulario te llega también por Telegram, y te avisa al publicar y en la revisión semanal.
Para activarlo:

1. En @BotFather, `/revoke` para sacar un token nuevo (el anterior se escribió en el chat).
2. Abre tu bot en Telegram y pulsa Iniciar (/start).
3. GitHub → Settings → Secrets and variables → Actions: secretos `TELEGRAM_BOT_TOKEN` (el nuevo) y `TELEGRAM_CHAT_ID`.
4. Workflow «Probar Telegram» (o pídeselo a Claude): te llega un mensaje de prueba.

## Siguientes fases (url-map → proximas_fases)

- Fase 2: cambio de bañera y fachadas en los 3 pueblos; pueblos nuevos: Las Torres de Cotillas, Alguazas,
  Lorquí, Archena, Santomera.
- Fase 3: Cartagena, Lorca, San Javier, Torre Pacheco, Cieza, Totana.
