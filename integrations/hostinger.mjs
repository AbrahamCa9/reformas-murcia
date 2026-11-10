// Integración propia: al terminar el build escribe lo que necesita Hostinger.
//   dist/.htaccess      → HTTPS, dominio sin www, 301, caché, cabeceras de seguridad, 404
//   dist/api/config.php → email de destino del formulario (sale de negocio.yaml)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerNegocio } from '../src/lib/datos-base.mjs';

const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const php = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function htaccess(negocio, redirecciones) {
  const host = new URL(negocio.dominio).host;
  const conWww = host.startsWith('www.');
  const sinWww = host.replace(/^www\./, '');
  const reglas301 = redirecciones
    .map((r) => `RewriteRule ^${escaparRegex(r.desde.replace(/^\//, '').replace(/\/$/, ''))}/?$ ${r.hacia} [R=301,L]`)
    .join('\n');
  return `# Generado por integrations/hostinger.mjs en cada build. No lo edites a mano.
Options -Indexes
DirectoryIndex index.html
ErrorDocument 404 /404.html

<IfModule mod_rewrite.c>
RewriteEngine On

# HTTPS
RewriteCond %{HTTPS} off
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Dominio canónico: ${host}
${
  conWww
    ? `RewriteCond %{HTTP_HOST} ^${escaparRegex(sinWww)}$ [NC]\nRewriteRule ^ https://${host}%{REQUEST_URI} [L,R=301]`
    : `RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]\nRewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]`
}

# Redirecciones 301 (url-map y src/data/redirecciones.yaml)
${reglas301}

# Barra final en las páginas
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !/$
RewriteCond %{REQUEST_URI} !\\.[a-zA-Z0-9]{2,5}$
RewriteRule ^(.*)$ /$1/ [L,R=301]
</IfModule>

<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
Header always set Strict-Transport-Security "max-age=31536000"
</IfModule>

<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/html "access plus 0 seconds"
ExpiresByType image/svg+xml "access plus 1 week"
ExpiresByType image/webp "access plus 1 year"
ExpiresByType image/avif "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType text/css "access plus 1 year"
ExpiresByType application/javascript "access plus 1 year"
ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/xml application/javascript image/svg+xml
</IfModule>
`;
}

function configPhp(negocio) {
  return `<?php
// Generado por integrations/hostinger.mjs desde src/data/negocio.yaml. No lo edites a mano.
return [
  'para' => ${php(negocio.email)},
  'marca' => ${php(negocio.marca)},
  'dominio' => ${php(new URL(negocio.dominio).host.replace(/^www\./, ''))},
  'gracias' => '/contacto/gracias/',
  'error' => '/contacto/',
];
`;
}

/** @param {{ redirecciones?: { desde: string, hacia: string }[] }} [opciones] */
export default function hostinger({ redirecciones = [] } = {}) {
  return {
    name: 'hostinger',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const salida = fileURLToPath(dir);
        const negocio = leerNegocio();
        writeFileSync(join(salida, '.htaccess'), htaccess(negocio, redirecciones));
        mkdirSync(join(salida, 'api'), { recursive: true });
        writeFileSync(join(salida, 'api', 'config.php'), configPhp(negocio));
        logger.info('.htaccess y api/config.php listos para Hostinger');
      },
    },
  };
}
