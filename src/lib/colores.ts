// Tonos derivados de los colores de marca, calculados en el build
// (así no dependemos de color-mix(), que algunos navegadores antiguos no entienden).

const aRgb = (hex: string) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const aHex = (rgb: number[]) =>
  '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

/** Mezcla `a` con `b`; `peso` es la proporción de `a` (0–1). */
export const mezclar = (a: string, b: string, peso: number) => {
  const x = aRgb(a);
  const y = aRgb(b);
  return aHex(x.map((v, i) => v * peso + y[i] * (1 - peso)));
};

/** Variables CSS de color para :root. */
export function variablesColor(primario: string, acento: string) {
  return {
    '--marca': primario,
    '--acento': acento,
    '--acento-osc': mezclar(acento, '#000000', 0.8),
    '--acento-suave': mezclar(acento, '#ffffff', 0.1),
    '--hero-brillo': mezclar(acento, primario, 0.3),
  };
}
