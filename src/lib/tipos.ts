// Tipos compartidos por los componentes.

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
}
