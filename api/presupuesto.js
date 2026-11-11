// Formulario de presupuesto en la DEMO de Vercel (en Hostinger lo hace public/api/contacto.php).
// Vercel no ejecuta PHP, así que aquí una función de Vercel recibe el formulario y manda el aviso por Telegram.
// El token y el chat se leen de las variables de entorno de Vercel (TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID)
// en el servidor: nunca llegan al navegador ni a los archivos de la web.
// Mismo antispam que el PHP: campo trampa, tiempo mínimo y validación.

const GRACIAS = '/contacto/gracias/';
const ERROR = '/contacto/';

const volver = (res, ruta) => {
  res.statusCode = 303;
  res.setHeader('Location', ruta);
  res.end();
};

async function leerCuerpo(req) {
  if (req.body && typeof req.body === 'object') return new URLSearchParams(req.body);
  if (typeof req.body === 'string') return new URLSearchParams(req.body);
  const trozos = [];
  for await (const t of req) trozos.push(t);
  return new URLSearchParams(Buffer.concat(trozos).toString('utf8'));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return volver(res, ERROR);

  const datos = await leerCuerpo(req);
  const campo = (n, max = 200) => String(datos.get(n) ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);
  const linea = (s) => s.replace(/[\r\n\t]+/g, ' ').trim();

  // 1) Campo trampa y 2) tiempo mínimo de 3 segundos: los bots se van a "gracias" sin enviar nada.
  if (campo('web') !== '') return volver(res, GRACIAS);
  const t = campo('t', 20);
  const sinJs = !/^\d+$/.test(t);
  if (!sinJs && Date.now() - Number(t) < 3000) return volver(res, GRACIAS);

  // 3) Validación
  const nombre = linea(campo('nombre', 80));
  const telefono = linea(campo('telefono', 25));
  const email = linea(campo('email', 120));
  const localidad = linea(campo('localidad', 80));
  const servicio = linea(campo('servicio', 120));
  const mensaje = campo('mensaje', 3000);
  const origen = linea(campo('origen', 200));
  const valido =
    nombre.length >= 2 &&
    /^[0-9 +().-]{9,25}$/.test(telefono) &&
    (email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) &&
    campo('privacidad', 5) === '1';
  if (!valido) return volver(res, `${ERROR}?error=datos#presupuesto`);

  // 4) Aviso por Telegram
  const token = (process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chat = (process.env.TELEGRAM_CHAT_ID ?? '').trim();
  if (!token || !chat) {
    console.error('Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en las variables de entorno de Vercel.');
    return volver(res, `${ERROR}?error=envio#presupuesto`);
  }
  const tema = `Presupuesto: ${servicio || 'reforma'}${localidad ? ` en ${localidad}` : ''}`;
  const texto = [
    `${sinJs ? '⚠️ Revisar, puede ser spam · ' : '🔔 '}[DEMO] ${tema}`,
    '',
    `Nombre: ${nombre}`,
    `Teléfono: ${telefono}`,
    `Email: ${email || '(no indicado)'}`,
    '',
    mensaje || '(sin mensaje)',
    '',
    `Página: ${origen}`,
  ].join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: texto.slice(0, 4000), link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(6000),
    });
    const json = await r.json().catch(() => null);
    if (!json?.ok) {
      console.error('Telegram no aceptó el mensaje:', json?.description ?? r.status);
      return volver(res, `${ERROR}?error=envio#presupuesto`);
    }
  } catch (e) {
    console.error('No se pudo contactar con Telegram:', e?.message ?? e);
    return volver(res, `${ERROR}?error=envio#presupuesto`);
  }

  return volver(res, GRACIAS);
}
