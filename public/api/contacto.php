<?php
// Formulario de presupuesto (Hostinger): valida, filtra spam, envía un email y, si está configurado,
// un aviso por Telegram. La configuración (email de destino, marca, dominio y Telegram) la genera
// el build en api/config.php; el token de Telegram llega desde los secretos de GitHub, nunca del repo.
declare(strict_types=1);
date_default_timezone_set('Europe/Madrid');

$config = require __DIR__ . '/config.php';

function volver(string $ruta): void
{
    header('Location: ' . $ruta, true, 303);
    exit;
}

/** Manda el aviso al Telegram del negocio. Devuelve false si no está configurado o Telegram no lo acepta. */
function avisarTelegram(array $config, string $texto): bool
{
    $token = (string) ($config['telegram_token'] ?? '');
    $chat = (string) ($config['telegram_chat'] ?? '');
    if ($token === '' || $chat === '') {
        return false;
    }
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    $datos = http_build_query([
        'chat_id' => $chat,
        'text' => mb_substr($texto, 0, 4000),
        'link_preview_options' => '{"is_disabled":true}',
    ]);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $datos,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 6,
        ]);
        $respuesta = curl_exec($ch);
        unset($ch);
    } else {
        $respuesta = @file_get_contents($url, false, stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $datos,
            'timeout' => 6,
            'ignore_errors' => true,
        ]]));
    }
    $json = is_string($respuesta) ? json_decode($respuesta, true) : null;
    return is_array($json) && ($json['ok'] ?? false) === true;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    volver('/contacto/');
}

$campo = static function (string $nombre, int $max = 200): string {
    $valor = str_replace(["\r\n", "\r"], "\n", trim((string) ($_POST[$nombre] ?? '')));
    return mb_substr($valor, 0, $max);
};
$linea = static fn (string $s): string => trim((string) preg_replace('/[\r\n\t]+/', ' ', $s));

// 1) Campo trampa: una persona no lo ve, un bot lo rellena.
if ($campo('web') !== '') {
    volver($config['gracias']);
}

// 2) Tiempo mínimo: nadie rellena el formulario en menos de 3 segundos.
$t = $campo('t', 20);
$sinJs = ($t === '' || !ctype_digit($t));
if (!$sinJs && ((int) floor(microtime(true) * 1000) - (int) $t) < 3000) {
    volver($config['gracias']);
}

// 3) Límite: máximo 5 envíos por hora desde la misma IP.
$registro = sys_get_temp_dir() . '/presupuesto-' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $config['dominio']);
$ahora = time();
$envios = is_file($registro)
    ? array_values(array_filter(array_map('intval', explode(',', (string) file_get_contents($registro))), fn ($x) => $x > $ahora - 3600))
    : [];
if (count($envios) >= 5) {
    volver($config['error'] . '?error=limite#presupuesto');
}

// 4) Validación
$nombre = $linea($campo('nombre', 80));
$telefono = $linea($campo('telefono', 25));
$email = $linea($campo('email', 120));
$localidad = $linea($campo('localidad', 80));
$servicio = $linea($campo('servicio', 120));
$mensaje = $campo('mensaje', 3000);
$origen = $linea($campo('origen', 200));

$valido = mb_strlen($nombre) >= 2
    && preg_match('/^[0-9 +().-]{9,25}$/', $telefono) === 1
    && ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) !== false)
    && $campo('privacidad', 5) === '1';
if (!$valido) {
    volver($config['error'] . '?error=datos#presupuesto');
}

// 5) Envío
$tema = 'Presupuesto: ' . ($servicio !== '' ? $servicio : 'reforma') . ($localidad !== '' ? ' en ' . $localidad : '');
$asunto = ($sinJs ? '[Revisar] ' : '') . $tema;
$cuerpo = implode("\n", [
    'Nueva solicitud de presupuesto desde la web',
    '',
    'Nombre: ' . $nombre,
    'Teléfono: ' . $telefono,
    'Email: ' . ($email !== '' ? $email : '(no indicado)'),
    'Localidad: ' . ($localidad !== '' ? $localidad : '(no indicada)'),
    'Trabajo: ' . ($servicio !== '' ? $servicio : '(no indicado)'),
    '',
    'Mensaje:',
    $mensaje !== '' ? $mensaje : '(sin mensaje)',
    '',
    '---',
    'Página: ' . $origen,
    'Fecha: ' . date('d/m/Y H:i'),
    'Aceptó la política de privacidad: sí',
]);
$cabeceras = [
    'From: ' . mb_encode_mimeheader($config['marca'], 'UTF-8') . ' <web@' . $config['dominio'] . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
if ($email !== '') {
    $cabeceras[] = 'Reply-To: ' . $email;
}

// Telegram: aviso corto para poder llamar al momento. Si el email falla pero Telegram llega, no se pierde.
$avisoTelegram = avisarTelegram($config, implode("\n", [
    ($sinJs ? '⚠️ Revisar, puede ser spam · ' : '🔔 ') . $tema,
    '',
    'Nombre: ' . $nombre,
    'Teléfono: ' . $telefono,
    'Email: ' . ($email !== '' ? $email : '(no indicado)'),
    '',
    $mensaje !== '' ? $mensaje : '(sin mensaje)',
    '',
    'Página: ' . $origen,
]));
$emailEnviado = mail($config['para'], mb_encode_mimeheader($asunto, 'UTF-8'), $cuerpo, implode("\r\n", $cabeceras));
if (!$emailEnviado && !$avisoTelegram) {
    volver($config['error'] . '?error=envio#presupuesto');
}

$envios[] = $ahora;
@file_put_contents($registro, implode(',', $envios), LOCK_EX);
volver($config['gracias']);
