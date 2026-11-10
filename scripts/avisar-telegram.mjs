// Manda un aviso al Telegram del negocio desde GitHub Actions (publicación, mantenimiento, prueba).
// Uso: node scripts/avisar-telegram.mjs [--obligatorio] "texto del aviso"
// Lee los secretos TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID. Si faltan, no hace nada y no rompe el workflow;
// con --obligatorio (workflow "Probar Telegram") falla y explica qué falta.
const argumentos = process.argv.slice(2);
const obligatorio = argumentos.includes('--obligatorio');
const texto = argumentos
  .filter((a) => a !== '--obligatorio')
  .join(' ')
  .trim();

const token = (process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
const chat = (process.env.TELEGRAM_CHAT_ID ?? '').trim();

function terminar(mensaje, fallo) {
  if (fallo && obligatorio) {
    console.error(mensaje);
    process.exit(1);
  }
  console.log(mensaje);
  process.exit(0);
}

if (!texto) terminar('Falta el texto del aviso.', true);
if (!token || !chat) {
  terminar(
    'Telegram sin configurar: faltan los secretos TELEGRAM_BOT_TOKEN y/o TELEGRAM_CHAT_ID ' +
      '(GitHub → Settings → Secrets and variables → Actions). No se envía el aviso.',
    true,
  );
}

let respuesta;
try {
  respuesta = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: texto.slice(0, 4000), link_preview_options: { is_disabled: true } }),
    signal: AbortSignal.timeout(15_000),
  });
} catch {
  terminar('No se pudo conectar con Telegram. Vuelve a probar en unos minutos.', true);
}

const datos = await respuesta.json().catch(() => ({}));
if (datos.ok !== true) {
  const pistas = {
    401: 'El token no vale: si lo regeneraste en @BotFather, pon el nuevo en el secreto TELEGRAM_BOT_TOKEN.',
    400: 'Revisa TELEGRAM_CHAT_ID y escríbele /start a tu bot desde tu Telegram.',
    403: 'El bot no puede escribirte: abre tu bot en Telegram y pulsa Iniciar (/start).',
  };
  terminar(`Telegram no aceptó el aviso (${datos.description ?? `HTTP ${respuesta.status}`}). ${pistas[respuesta.status] ?? ''}`, true);
}
console.log('Aviso enviado a Telegram.');
