// Tipos compartidos por los componentes.
import type { Foto } from './fotos';

/** Enlace interno con texto descriptivo del destino. */
export interface Enlace {
  texto: string;
  href: string;
  detalle?: string;
}

/** Tarjeta de servicio. */
export interface ItemServicio {
  nombre: string;
  href: string;
  icono: string;
  resumen?: string;
  etiqueta?: string;
  /** Con foto, la tarjeta sale grande y primero. */
  foto?: Foto;
}
