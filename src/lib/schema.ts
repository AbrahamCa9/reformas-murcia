// Datos estructurados (JSON-LD) tipados con schema-dts: si un campo no existe en
// schema.org, `npm run check` falla antes de publicar. El QA comprueba además que
// cada página cumple el contrato de blueprint/.../schema-templates/.
import type {
  BreadcrumbList,
  FAQPage,
  GeneralContractor,
  ItemList,
  OpeningHoursSpecification,
  Service,
  Thing,
  WebSite,
} from 'schema-dts';
import { negocio, contacto, municipios, absoluta } from './datos';

export type Pregunta = { pregunta: string; respuesta: string };
export type Miga = { nombre: string; ruta: string };

const ID_NEGOCIO = `${negocio.dominio}/#negocio`;

const direccion = () => ({
  '@type': 'PostalAddress' as const,
  ...(negocio.direccion_publica
    ? { streetAddress: negocio.direccion_publica.calle, postalCode: negocio.direccion_publica.cp }
    : {}),
  addressLocality: negocio.ciudad,
  addressRegion: negocio.region,
  addressCountry: negocio.pais,
});

const baseNegocio = () => ({
  '@type': 'GeneralContractor' as const,
  '@id': ID_NEGOCIO,
  name: negocio.marca,
  url: absoluta('/'),
  telephone: contacto.telefonoE164,
  address: direccion(),
});

/** Referencia compacta al negocio para usar como `provider`. */
export const proveedor = (): GeneralContractor => baseNegocio();

/** Ficha completa del negocio (home y contacto). */
export function negocioCompleto(servicios: { nombre: string; ruta: string }[]): GeneralContractor {
  const horario: OpeningHoursSpecification[] = negocio.horario.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.dias.map((d) => `https://schema.org/${dia[d]}`) as OpeningHoursSpecification['dayOfWeek'],
    opens: h.abre,
    closes: h.cierra,
  }));
  return {
    ...baseNegocio(),
    email: negocio.email,
    description: negocio.eslogan,
    areaServed: [
      { '@type': 'AdministrativeArea', name: negocio.region },
      ...municipios.map((m) => ({ '@type': 'City' as const, name: m.nombre })),
    ],
    ...(horario.length ? { openingHoursSpecification: horario } : {}),
    ...(negocio.resenas.nota && negocio.resenas.total
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: negocio.resenas.nota,
            reviewCount: negocio.resenas.total,
          },
        }
      : {}),
    ...(negocio.resenas.url_google ? { sameAs: [negocio.resenas.url_google] } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de reformas',
      itemListElement: servicios.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.nombre, url: absoluta(s.ruta) },
      })),
    },
  };
}

const dia: Record<string, string> = {
  Mo: 'Monday',
  Tu: 'Tuesday',
  We: 'Wednesday',
  Th: 'Thursday',
  Fr: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};

export const sitioWeb = (): WebSite => ({
  '@type': 'WebSite',
  '@id': `${negocio.dominio}/#web`,
  url: absoluta('/'),
  name: negocio.marca,
  inLanguage: 'es-ES',
  publisher: { '@id': ID_NEGOCIO },
});

export const servicio = (o: {
  nombre: string;
  tipo: string;
  descripcion: string;
  ruta: string;
  zona?: string;
}): Service => ({
  '@type': 'Service',
  name: o.nombre,
  serviceType: o.tipo,
  description: o.descripcion,
  url: absoluta(o.ruta),
  provider: proveedor(),
  areaServed: o.zona
    ? { '@type': 'City', name: o.zona, containedInPlace: { '@type': 'AdministrativeArea', name: negocio.region } }
    : [
        { '@type': 'City', name: negocio.ciudad },
        { '@type': 'AdministrativeArea', name: negocio.region },
      ],
});

export const migas = (items: Miga[]): BreadcrumbList => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((m, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: m.nombre,
    item: absoluta(m.ruta),
  })),
});

export const faq = (preguntas: Pregunta[]): FAQPage => ({
  '@type': 'FAQPage',
  mainEntity: preguntas.map((p) => ({
    '@type': 'Question',
    name: p.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
  })),
});

export const listaServicios = (nombre: string, items: { nombre: string; ruta: string }[]): ItemList => ({
  '@type': 'ItemList',
  name: nombre,
  itemListElement: items.map((s, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: { '@type': 'Service', name: s.nombre, url: absoluta(s.ruta) },
  })),
});

/** Grafo final que se pinta en <script type="application/ld+json">. */
export const grafo = (nodos: Thing[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodos,
});
