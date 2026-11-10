// Datos del negocio y del blueprint, validados.
// Si falta un dato obligatorio, el build falla con un mensaje claro: así un cambio
// de contenido no puede romper la web en silencio.
import { z } from 'astro/zod';
import {
  leerNegocio,
  leerUrlMap,
  leerEnlazado,
  leerPlantilla,
  leerYaml,
  paresServicioZona,
  telefonoE164,
  telefonoWa,
  indexable,
} from './datos-base.mjs';

const Texto = z.object({ titulo: z.string().min(3), texto: z.string().min(10), icono: z.string().optional() });
const Color = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Usa un color en formato #RRGGBB');
const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones (sin tildes ni ñ)');

const NegocioSchema = z.object({
  marca: z.string().min(2),
  eslogan: z.string().min(10),
  dominio: z
    .url()
    .refine((s) => !s.endsWith('/'), 'El dominio va sin barra final'),
  telefono: z.string().min(9),
  whatsapp: z.string().nullish(),
  email: z.email(),
  ciudad: z.string(),
  provincia: z.string(),
  region: z.string(),
  pais: z.string().length(2),
  direccion_publica: z.object({ calle: z.string(), cp: z.string() }).nullish(),
  tipo_schema: z.string(),
  horario: z
    .array(
      z.object({
        dias: z.array(z.enum(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])),
        abre: z.string().regex(/^\d\d:\d\d$/),
        cierra: z.string().regex(/^\d\d:\d\d$/),
      }),
    )
    .default([]),
  anios_experiencia: z.number().int().positive().nullish(),
  certificaciones: z.array(z.string()).default([]),
  resenas: z.object({
    nota: z.number().min(1).max(5).nullish(),
    total: z.number().int().nonnegative().nullish(),
    url_google: z.url().nullish(),
    testimonios: z
      .array(z.object({ nombre: z.string(), zona: z.string().optional(), texto: z.string().min(20) }))
      .default([]),
  }),
  garantias: z.array(Texto).min(2),
  proceso: z.array(Texto).min(3),
  colores: z.object({ primario: Color, acento: Color }),
  analitica: z
    .object({ proveedor: z.enum(['plausible', 'umami']), dominio: z.string(), id: z.string().optional() })
    .nullish(),
  legal: z.object({ titular: z.string(), nif: z.string(), domicilio: z.string() }),
  pendientes: z.array(z.string()).default([]),
});

const PlantillaSchema = z.object({
  tipo: z.string(),
  url: z.string(),
  title: z.string(),
  meta_description: z.string(),
  h1: z.string(),
  secciones: z.array(z.string()).min(3),
  schema: z.array(z.string()),
  palabras_min: z.number(),
  palabras_unicas_min: z.number().optional(),
  similitud_max: z.number().optional(),
  faq_min: z.number().default(0),
});

const UrlMapSchema = z.object({
  ciudad_principal: z.string(),
  limite_servicio_x_zona: z.number().default(60),
  servicios: z.array(Slug).min(1),
  zonas: z.array(Slug).default([]),
  servicio_x_zona: z.array(z.object({ servicio: Slug, zonas: z.array(Slug) })).default([]),
  paginas: z.array(z.string()).default([]),
  legales: z.array(z.string()).default([]),
});

function validar<T>(schema: z.ZodType<T>, datos: unknown, origen: string): T {
  const r = schema.safeParse(datos);
  if (!r.success) {
    const detalle = r.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Datos no válidos en ${origen}:\n${detalle}`);
  }
  return r.data;
}

export const negocio = validar(NegocioSchema, leerNegocio(), 'src/data/negocio.yaml');
export const urlMap = validar(UrlMapSchema, leerUrlMap(), 'blueprint/.../url-map.yaml');
export const enlazado = leerEnlazado();
export const pares = paresServicioZona(urlMap);

// Slugs que chocarían con páginas fijas (/{servicio}/{zona}/ cuelga de la raíz).
const RESERVADAS = ['servicios', 'zonas', 'contacto', 'sobre-nosotros', 'aviso-legal', 'politica-de-privacidad', 'politica-de-cookies', 'api', '_astro', '404'];
for (const s of urlMap.servicios) {
  if (RESERVADAS.includes(s)) throw new Error(`"${s}" no puede ser slug de servicio: choca con una página fija de la web.`);
}
if (pares.length > urlMap.limite_servicio_x_zona) {
  throw new Error(
    `El url-map pide ${pares.length} páginas servicio × pueblo y el tope es ${urlMap.limite_servicio_x_zona}. ` +
      'Sube el tope solo si cada página tiene texto local propio (riesgo de "doorway pages").',
  );
}

export type TipoPagina = 'home' | 'service-pillar' | 'service-area' | 'area-hub';
export type Plantilla = z.infer<typeof PlantillaSchema>;
export const plantillas: Record<TipoPagina, Plantilla> = {
  home: validar(PlantillaSchema, leerPlantilla('home'), 'page-templates/home.md'),
  'service-pillar': validar(PlantillaSchema, leerPlantilla('service-pillar'), 'page-templates/service-pillar.md'),
  'service-area': validar(PlantillaSchema, leerPlantilla('service-area'), 'page-templates/service-area.md'),
  'area-hub': validar(PlantillaSchema, leerPlantilla('area-hub'), 'page-templates/area-hub.md'),
};

export const municipios: { nombre: string; slug: string }[] = leerYaml('src/data/municipios-region-murcia.yaml').municipios;

/** Contacto listo para enlaces. */
export const contacto = {
  telefonoVisible: negocio.telefono.replace(/^\+34\s?/, ''),
  telefonoHref: `tel:${telefonoE164(negocio.telefono)}`,
  telefonoE164: telefonoE164(negocio.telefono),
  whatsappHref: negocio.whatsapp ? `https://wa.me/${telefonoWa(negocio.whatsapp)}` : null,
  email: negocio.email,
};

/** ¿Hay reseñas reales que enseñar? Sin datos, la sección de reseñas no existe. */
export const hayResenas = Boolean((negocio.resenas.nota && negocio.resenas.total) || negocio.resenas.testimonios.length);

/** Solo el despliegue final (Hostinger) se indexa. Vercel y local: noindex. */
export const INDEXAR = indexable();

/** URL absoluta canónica a partir de una ruta interna. */
export const absoluta = (ruta: string) => new URL(ruta, negocio.dominio + '/').href;
