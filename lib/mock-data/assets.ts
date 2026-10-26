/**
 * Placeholders visuales locales para el prototipo.
 *
 * NO hay assets de mascotas en el repo (no existe public/) y no se descarga
 * nada externo. Se generan SVG inline como data-URI, usando la paleta
 * oficial de Lovi (ver tailwind.config.ts):
 *
 *   naranja  #F39D23   fucsia #D51993   crema  #F9F2E4
 *   ink      #282B0A   amarillo #F5D244  azul   #294EA7
 *
 * Formas orgánicas y blobs, no rectangulos grises: para poder evaluar la
 * jerarquia visual del feed con algo que se parezca al tono handmade.
 *
 * Cuando existan fotos reales, se reemplaza la fuente de `url` y los
 * componentes no cambian.
 */

const PALETTE = {
  orange: "#F39D23",
  fucsia: "#D51993",
  cream: "#F9F2E4",
  ink: "#282B0A",
  butter: "#F5D244",
  navy: "#294EA7",
  parchment: "#FFFBF0",
} as const;

type PaletteKey = keyof typeof PALETTE;

/** Pares de color por defecto para que ninguna imagen quede sin contraste. */
const COMBOS: PaletteKey[][] = [
  ["orange", "butter"],
  ["fucsia", "orange"],
  ["navy", "butter"],
  ["butter", "orange"],
  ["fucsia", "navy"],
  ["orange", "cream"],
  ["navy", "fucsia"],
];

/** Hash deterministico: mismo seed, mismo placeholder siempre. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: string, salt: string): T {
  return arr[hash(seed + salt) % arr.length];
}

function svgToDataUri(svg: string): string {
  // encodeURIComponent solo sobre los caracteres problematicos, para que el
  // data-URI quede legible y no rompa comillas en el atributo src.
  const encoded = svg
    .replace(/"/g, "'")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
  return `data:image/svg+xml,${encoded}`;
}

/** Blob organico: una elipse deformada, nunca un rectangulo. */
function blob(cx: number, cy: number, r: number, fill: string, seed: string): string {
  const h = hash(seed);
  const points: string[] = [];
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    // Radio variable por punto: eso es lo que lo hace organico.
    const wobble = r * (0.78 + (((h >> (i * 3)) % 100) / 100) * 0.44);
    const x = cx + Math.cos(angle) * wobble;
    const y = cy + Math.sin(angle) * wobble;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${fill}"/>`;
}

/**
 * Imagen generica de mascota: composicion de blobs + una silueta sugerida.
 * El "hocico" es unipse + dos orejas, para que se lea como animal sin ser
 * una ilustracion definitiva.
 */
function petScene(seed: string, w: number, h: number): string {
  const [c1, c2] = pick(COMBOS, seed, "combo");
  const cx = w / 2;
  const cy = h / 2 + h * 0.06;
  const r = Math.min(w, h) * 0.31;

  const earFill = PALETTE[c2];
  const bodyFill = PALETTE[c1];
  const inner = PALETTE.ink;

  const shapes = [
    // Fondo crema: mantiene la estetica scrapbook.
    `<rect width="${w}" height="${h}" fill="${PALETTE.cream}"/>`,
    // Manchas de color de fondo.
    blob(cx - w * 0.22, cy - h * 0.16, r * 1.15, PALETTE.parchment, seed + "bg1"),
    blob(cx + w * 0.24, cy + h * 0.12, r * 0.95, PALETTE.butter, seed + "bg2"),
    // Collar / banda: detalle de color para que no sea plano.
    `<path d="M${cx - r * 0.75} ${cy + r * 0.72} Q${cx} ${cy + r * 1.15} ${cx + r * 0.75} ${cy + r * 0.72}"
       fill="none" stroke="${PALETTE.fucsia}" stroke-width="${r * 0.16}" stroke-linecap="round"/>`,
    // Orejas.
    `<ellipse cx="${cx - r * 0.72}" cy="${cy - r * 0.62}" rx="${r * 0.3}" ry="${r * 0.46}"
       fill="${earFill}" transform="rotate(-22 ${cx - r * 0.72} ${cy - r * 0.62})"/>`,
    `<ellipse cx="${cx + r * 0.72}" cy="${cy - r * 0.62}" rx="${r * 0.3}" ry="${r * 0.46}"
       fill="${earFill}" transform="rotate(22 ${cx + r * 0.72} ${cy - r * 0.62})"/>`,
    // Cabeza.
    blob(cx, cy, r, bodyFill, seed + "head"),
    // Ojos.
    `<circle cx="${cx - r * 0.32}" cy="${cy - r * 0.08}" r="${r * 0.1}" fill="${inner}"/>`,
    `<circle cx="${cx + r * 0.32}" cy="${cy - r * 0.08}" r="${r * 0.1}" fill="${inner}"/>`,
    // Hocico.
    `<ellipse cx="${cx}" cy="${cy + r * 0.32}" rx="${r * 0.34}" ry="${r * 0.26}" fill="${PALETTE.cream}"/>`,
    `<ellipse cx="${cx}" cy="${cy + r * 0.2}" rx="${r * 0.12}" ry="${r * 0.09}" fill="${inner}"/>`,
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${shapes.join("")}</svg>`;
}

/** Avatar humano: circulo con iniciales, nunca una cara genérica. */
function avatarScene(seed: string, size: number, initials: string): string {
  const [c1, c2] = pick(COMBOS, seed, "combo");
  const cx = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${PALETTE.cream}"/>
    ${blob(cx, size * 0.42, size * 0.42, PALETTE[c1], seed + "hair")}
    <circle cx="${cx}" cy="${size * 0.72}" r="${size * 0.28}" fill="${PALETTE[c2]}"/>
    <text x="${cx}" y="${size * 0.79}" text-anchor="middle"
      font-family="Georgia, serif" font-weight="bold"
      font-size="${size * 0.26}" fill="${PALETTE.ink}">${initials}</text>
  </svg>`;
}

/** Contenido de un Lovi: textura editorial, no un rectángulo liso. */
function mediaScene(seed: string, w: number, h: number, tint: PaletteKey): string {
  const base = PALETTE[tint];
  const shapes = [
    `<rect width="${w}" height="${h}" fill="${PALETTE.cream}"/>`,
    blob(w * 0.24, h * 0.3, Math.min(w, h) * 0.3, base, seed + "a"),
    blob(w * 0.74, h * 0.66, Math.min(w, h) * 0.28, PALETTE[tint === "orange" ? "fucsia" : "orange"], seed + "b"),
    blob(w * 0.5, h * 0.22, Math.min(w, h) * 0.18, PALETTE.parchment, seed + "c"),
  ];
  // Marcas de "scrapbook": dos lineas que sugieren una foto pegada.
  shapes.push(
    `<rect x="${w * 0.08}" y="${h * 0.62}" width="${w * 0.3}" height="${h * 0.035}" rx="${h * 0.018}" fill="${PALETTE.ink}" opacity="0.28"/>`,
    `<rect x="${w * 0.08}" y="${h * 0.72}" width="${w * 0.19}" height="${h * 0.03}" rx="${h * 0.015}" fill="${PALETTE.ink}" opacity="0.18"/>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${shapes.join("")}</svg>`;
}

export function petImage(seed: string, w = 640, h = 480): string {
  return svgToDataUri(petScene(seed, w, h));
}

export function userAvatar(name: string, seed?: string): string {
  const initials = (name.trim()[0] ?? "?").toUpperCase();
  return svgToDataUri(avatarScene(seed ?? name, 240, initials));
}

export function mediaImage(seed: string, w = 800, h = 600, tint?: PaletteKey): string {
  const t = tint ?? (pick(COMBOS, seed, "tint")[0] as PaletteKey);
  return svgToDataUri(mediaScene(seed, w, h, t));
}

/**
 * Avatar pequeno dentro de un chip de collage, con circulo de recorte.
 * Se usa como thumbnail de mascota en el header del feed.
 */
export function petThumb(seed: string, size = 96): string {
  const [c1, c2] = pick(COMBOS, seed, "combo");
  return svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${PALETTE.cream}"/>
      ${blob(size * 0.5, size * 0.5, size * 0.44, PALETTE[c1], seed + "t")}
      <circle cx="${size * 0.38}" cy="${size * 0.45}" r="${size * 0.07}" fill="${PALETTE.ink}"/>
      <circle cx="${size * 0.62}" cy="${size * 0.45}" r="${size * 0.07}" fill="${PALETTE.ink}"/>
      <ellipse cx="${size * 0.5}" cy="${size * 0.64}" rx="${size * 0.2}" ry="${size * 0.14}" fill="${PALETTE[c2]}"/>
    </svg>`,
  );
}
