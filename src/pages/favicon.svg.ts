// Favicon generado con los colores de negocio.yaml.
import type { APIRoute } from 'astro';
import { negocio } from '../lib/datos';

export const GET: APIRoute = () =>
  new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${negocio.colores.acento}"/><path d="M7 15 16 7.5l9 7.5M9.5 13.5V25h13V13.5M14 25v-6h4v6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
