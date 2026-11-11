// Descarga las fotos de data/fotos.yaml que aún no están en src/assets/fotos/,
// las optimiza (máx. 1600 px de ancho, WebP) y las guarda con su nombre SEO.
// Astro genera después las versiones AVIF/WebP de cada tamaño en el build.
//
// Uso: npm run fotos   (en GitHub lo lanza el workflow "Importar fotos")
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { parse } from 'yaml';

const CARPETA = 'src/assets/fotos';
const HOSTS = ['fal.media']; // orígenes permitidos (y sus subdominios)
const ARCHIVO_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const { fotos = [] } = parse(readFileSync('data/fotos.yaml', 'utf8')) ?? {};
mkdirSync(CARPETA, { recursive: true });

let nuevas = 0;
for (const foto of fotos) {
  if (!ARCHIVO_VALIDO.test(foto.archivo ?? '')) throw new Error(`Nombre de archivo no válido: "${foto.archivo}"`);
  if (!foto.alt || foto.alt.length < 10) throw new Error(`Falta un alt descriptivo en "${foto.archivo}"`);
  const destino = `${CARPETA}/${foto.archivo}.webp`;
  if (existsSync(destino)) continue;

  const url = new URL(foto.url);
  const permitido = url.protocol === 'https:' && HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  if (!permitido) throw new Error(`Origen no permitido para "${foto.archivo}": ${url.hostname}`);

  let respuesta;
  try {
    respuesta = await fetch(url);
  } catch (error) {
    throw new Error(
      `No se pudo descargar "${foto.archivo}" (${error.cause?.code ?? error.message}). ` +
        'Si estás en el entorno de Claude, no tiene acceso a ese dominio: lo importa el workflow "Importar fotos" de GitHub.',
    );
  }
  if (!respuesta.ok) throw new Error(`No se pudo descargar "${foto.archivo}": HTTP ${respuesta.status}`);
  const original = Buffer.from(await respuesta.arrayBuffer());

  const info = await sharp(original)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(destino);
  console.log(`✓ ${destino} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
  nuevas++;
}

console.log(nuevas ? `${nuevas} foto(s) nuevas.` : 'No hay fotos nuevas que importar.');
