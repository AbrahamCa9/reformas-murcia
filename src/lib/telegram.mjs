// Avisos por Telegram (cada presupuesto del formulario llega también al móvil).
// El token y el chat NUNCA van en el repo: son secretos de GitHub (TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID)
// y solo los recibe el build del despliegue a Hostinger, que los escribe en api/config.php.

/**
 * Datos de Telegram para este build, o null si los avisos no se activan.
 * @returns {{ token: string, chat: string } | null}
 */
export function telegramDelDespliegue() {
  // Vercel no ejecuta PHP: serviría api/config.php como texto y el token quedaría a la vista.
  if (process.env.VERCEL) return null;
  const token = (process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chat = (process.env.TELEGRAM_CHAT_ID ?? '').trim();
  if (!token && !chat) return null;
  if (!/^\d+:[\w-]{30,}$/.test(token)) {
    throw new Error(
      'El secreto TELEGRAM_BOT_TOKEN falta o no tiene forma de token de Telegram (números:letras). Cópialo otra vez de @BotFather.',
    );
  }
  if (!/^-?\d+$/.test(chat)) {
    throw new Error('El secreto TELEGRAM_CHAT_ID falta o no es solo números (es tu Id de Telegram).');
  }
  return { token, chat };
}
