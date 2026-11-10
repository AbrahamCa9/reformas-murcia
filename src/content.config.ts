// Colecciones de contenido editables en Markdown.
// Cada campo está validado: si falta algo obligatorio, `npm run build` avisa y no publica.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pregunta = z.object({
  pregunta: z.string().min(10).refine((s) => s.trim().endsWith('?'), 'La pregunta debe terminar en "?"'),
  respuesta: z.string().min(40),
});

const iconos = [
  'casa',
  'bano',
  'ducha',
  'cocina',
  'fachada',
  'rayo',
  'gota',
  'garaje',
  'local',
  'rodillo',
  'pladur',
  'tejado',
] as const;

/** Servicios: una página pilar por archivo (/servicios/{archivo}/). */
const servicios = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/servicios' }),
  schema: z.object({
    nombre: z.string().min(4), // "Reforma de baños"
    nombre_corto: z.string().optional(), // para menús estrechos
    resumen: z.string().min(70).max(115), // tarjetas y meta description (≤ 115 para que quepa el teléfono)
    icono: z.enum(iconos),
    titulo_variantes: z.string().default('Qué incluye este servicio'),
    variantes: z.array(z.object({ titulo: z.string(), texto: z.string().min(40) })).min(3),
    titulo_precio: z.string().default('Qué influye en el precio en {zona}'), // {zona} = Murcia o el pueblo
    factores_precio: z.array(z.string().min(10)).min(3),
    precio_orientativo: z.string().optional(), // solo si el negocio define sus precios
    faqs: z.array(pregunta).min(5),
    relacionados: z.array(reference('servicios')).min(3),
    pendiente: z.boolean().default(false), // true = borrador creado por `npm run generar`
    actualizado: z.coerce.date(),
  }),
});

/** Zonas: un archivo por pueblo con página propia (/zonas/{archivo}/). */
const zonas = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/zonas' }),
  schema: z.object({
    nombre: z.string(), // "Molina de Segura"
    comarca: z.string().optional(),
    gancho: z.string().min(40).max(90), // frase local para hero y meta description
    ayuntamiento: z.string(), // "Ayuntamiento de Molina de Segura" (paso de permisos)
    referencias: z.array(z.string()).default([]), // barrios, pedanías, urbanizaciones (verificados)
    cercanas: z.array(z.string()).default([]), // slugs de pueblos cercanos (de municipios-region-murcia.yaml)
    faqs: z.array(pregunta).min(4),
    fuentes: z.array(z.string()).default([]), // de dónde salen los datos locales
    pendiente: z.boolean().default(false),
    actualizado: z.coerce.date(),
  }),
});

/**
 * Landings servicio × pueblo: src/content/landings/{servicio}/{pueblo}.md
 * El texto del cuerpo tiene que ser propio de la combinación (lo comprueba el QA).
 */
const landings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/landings' }),
  schema: z.object({
    gancho: z.string().min(40).max(90),
    faqs_locales: z.array(pregunta).min(3),
    pendiente: z.boolean().default(false),
    actualizado: z.coerce.date(),
  }),
});

/** Textos de páginas fijas (inicio, sobre-nosotros, contacto). */
const paginas = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/paginas' }),
  schema: z.object({
    intro: z.string().min(40), // entradilla bajo el H1
    faqs: z.array(pregunta).default([]),
    factores_precio: z.array(z.string().min(10)).default([]),
    actualizado: z.coerce.date(),
  }),
});

export const collections = { servicios, zonas, landings, paginas };
