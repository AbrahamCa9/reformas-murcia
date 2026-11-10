// Rellena los patrones del blueprint ("{servicio} en {zona} | {marca}") con datos reales.
import { negocio, contacto, plantillas, type TipoPagina } from './datos';

export type Variables = Record<string, string | undefined>;

const LIMITE_TITLE = 65;
const LIMITE_META = 160;

/** Variables comunes a todas las páginas. */
export const variablesBase = (): Variables => ({
  marca: negocio.marca,
  ciudad: negocio.ciudad,
  provincia: negocio.provincia,
  region: negocio.region,
  telefono: contacto.telefonoVisible,
});

/** Sustituye {variable}. Si falta una variable, falla el build (mejor que publicar "{zona}"). */
export function rellenar(patron: string, vars: Variables): string {
  return patron
    .replace(/\{(\w+)\}/g, (_, clave: string) => {
      const valor = vars[clave];
      if (valor === undefined || valor === '') {
        throw new Error(`Falta la variable {${clave}} para el patrón "${patron}"`);
      }
      return valor;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Title: si pasa de 65 caracteres, quita " | {marca}" para que Google no lo corte. */
export function titulo(patron: string, vars: Variables): string {
  const completo = rellenar(patron, vars);
  if (completo.length <= LIMITE_TITLE) return completo;
  const sinMarca = patron.replace(/\s*\|\s*\{marca\}\s*$/, '');
  return rellenar(sinMarca, vars);
}

/** Meta description: recorta en la última palabra antes de 160 caracteres. */
export function descripcion(patron: string, vars: Variables): string {
  const texto = rellenar(patron, vars);
  if (texto.length <= LIMITE_META) return texto;
  console.warn(`[seo] Meta description de ${texto.length} caracteres recortada: acorta el resumen o el gancho → "${texto}"`);
  const corte = texto.slice(0, LIMITE_META - 1);
  return corte.slice(0, corte.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}

/** Title, description y H1 de una página según su plantilla del blueprint. */
export function seo(tipo: TipoPagina, extra: Variables) {
  const p = plantillas[tipo];
  const vars = { ...variablesBase(), ...extra };
  return {
    title: titulo(p.title, vars),
    description: descripcion(p.meta_description, vars),
    h1: rellenar(p.h1, vars),
    secciones: p.secciones,
    plantilla: p,
  };
}

/** "Reforma de baños" → "reforma de baños" (para usar a mitad de frase). */
export const enMinuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
