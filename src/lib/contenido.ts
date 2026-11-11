// Acceso al contenido en el orden y con las reglas del blueprint.
// Si el url-map pide una página que no tiene texto, el build se para y dice qué hacer.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { urlMap, pares } from './datos';

export type Servicio = CollectionEntry<'servicios'>;
export type Zona = CollectionEntry<'zonas'>;
export type Landing = CollectionEntry<'landings'>;
export type Pagina = CollectionEntry<'paginas'>;

const AYUDA = 'Ejecuta `npm run generar` para ver qué falta y `npm run generar -- --aplicar` para crear los borradores.';

let cache: { servicios: Servicio[]; zonas: Zona[]; landings: Map<string, Landing> } | null = null;

async function cargar() {
  if (cache) return cache;
  const todosServicios = await getCollection('servicios');
  const todasZonas = await getCollection('zonas');
  const todasLandings = await getCollection('landings');

  const servicios = urlMap.servicios.map((slug) => {
    const s = todosServicios.find((e) => e.id === slug);
    if (!s) throw new Error(`El url-map incluye el servicio "${slug}" pero falta src/content/servicios/${slug}.md. ${AYUDA}`);
    return s;
  });

  const zonas = urlMap.zonas.map((slug) => {
    const z = todasZonas.find((e) => e.id === slug);
    if (!z) throw new Error(`El url-map incluye la zona "${slug}" pero falta src/content/zonas/${slug}.md. ${AYUDA}`);
    return z;
  });

  const landings = new Map<string, Landing>();
  for (const { servicio, zona } of pares) {
    if (!urlMap.servicios.includes(servicio)) throw new Error(`servicio_x_zona usa "${servicio}", que no está en servicios del url-map.`);
    if (!urlMap.zonas.includes(zona)) throw new Error(`servicio_x_zona usa la zona "${zona}", que no está en zonas del url-map.`);
    const l = todasLandings.find((e) => e.id === `${servicio}/${zona}`);
    if (!l) throw new Error(`Falta el texto de /${servicio}/${zona}/ (src/content/landings/${servicio}/${zona}.md). ${AYUDA}`);
    landings.set(`${servicio}/${zona}`, l);
  }

  cache = { servicios, zonas, landings };
  return cache;
}

export async function servicios() {
  return (await cargar()).servicios;
}

export async function zonas() {
  return (await cargar()).zonas;
}

export async function landing(servicio: string, zona: string) {
  const l = (await cargar()).landings.get(`${servicio}/${zona}`);
  if (!l) throw new Error(`No hay landing ${servicio}/${zona}`);
  return l;
}

/** Textos de páginas fijas: src/content/paginas/{id}.md */
export async function pagina(id: string) {
  const p = await getEntry('paginas', id);
  if (!p) throw new Error(`Falta src/content/paginas/${id}.md`);
  return p;
}

/** Pueblos donde un servicio tiene página propia. */
export async function zonasDeServicio(servicio: string) {
  const zs = await zonas();
  const slugs = pares.filter((p) => p.servicio === servicio).map((p) => p.zona);
  return zs.filter((z) => slugs.includes(z.id));
}

/** Servicios con página propia en un pueblo. */
export async function serviciosDeZona(zona: string) {
  const ss = await servicios();
  const slugs = pares.filter((p) => p.zona === zona).map((p) => p.servicio);
  return ss.filter((s) => slugs.includes(s.id));
}

// Rutas internas (una sola definición para toda la web)
export const rutas = {
  home: '/',
  servicios: '/servicios/',
  servicio: (slug: string) => `/servicios/${slug}/`,
  zonas: '/zonas/',
  zona: (slug: string) => `/zonas/${slug}/`,
  landing: (servicio: string, zona: string) => `/${servicio}/${zona}/`,
  contacto: '/contacto/',
  sobreNosotros: '/sobre-nosotros/',
  avisoLegal: '/aviso-legal/',
  privacidad: '/politica-de-privacidad/',
  cookies: '/politica-de-cookies/',
};
