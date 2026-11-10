// Fotos de la web. En el contenido se nombra el archivo (campo `foto`) y el alt sale de data/fotos.yaml.
// Las fotos viven en src/assets/fotos/ (las importa el workflow "Importar fotos" o `npm run fotos`).
import type { ImageMetadata } from 'astro';
import { leerYaml } from './datos-base.mjs';

export interface Foto {
  src: ImageMetadata;
  alt: string;
}

const archivos = import.meta.glob<{ default: ImageMetadata }>('../assets/fotos/*.webp', { eager: true });
const manifiesto: { archivo: string; alt: string }[] = leerYaml('data/fotos.yaml').fotos ?? [];

export function foto(archivo?: string): Foto | undefined {
  if (!archivo) return undefined;
  const entrada = manifiesto.find((f) => f.archivo === archivo);
  if (!entrada) throw new Error(`La foto "${archivo}" no está en data/fotos.yaml`);
  const modulo = archivos[`../assets/fotos/${archivo}.webp`];
  if (!modulo) {
    throw new Error(`Falta src/assets/fotos/${archivo}.webp: impórtala con el workflow "Importar fotos" o con npm run fotos`);
  }
  return { src: modulo.default, alt: entrada.alt };
}
