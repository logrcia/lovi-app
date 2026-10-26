/**
 * Lovis del prototipo.
 *
 * Cada Lovi tiene 0..N medios. Los casos a cubrir para validar el render:
 *
 *   - 1 imagen            -> protagonista
 *   - varias imagenes     -> carrusel horizontal
 *   - video               -> se representa visualmente (no hay asset real)
 *   - audio               -> se representa visualmente (no hay asset real)
 *   - solo texto          -> sin bloque de media
 *   - texto + multimedia  -> mixto
 *
 * Para video y audio la `url` es un SVG local que representa la escena: sirve
 * como poster/placeholder hasta que existan assets reales. El componente
 * igual renderiza el <video>/<audio> con controles para que el estado del
 * elemento nativo ya quede probado; si el src no decodifica, se ve el
 * poster de fondo y los controles siguen siendo interactivos.
 *
 * Cuando se conecte Supabase: una fila de `lovis` + filas de `lovi_media`
 * ordenadas por `position` dan exactamente este tipo.
 */

import { mediaImage } from "./assets";
import type { MockLovi, MockMedia } from "./types";

/** Atajo: imagen unica. */
function img(id: string, seed: string, alt?: string): MockMedia {
  return { id, type: "image", url: mediaImage(seed, 800, 600), alt };
}

/** Atajo: video simulado (poster SVG local). */
function video(id: string, seed: string, alt?: string): MockMedia {
  const poster = mediaImage(seed + "-poster", 800, 600, "navy");
  return { id, type: "video", url: poster, posterUrl: poster, alt };
}

/** Atajo: audio simulado. */
function audio(id: string, seed: string, alt?: string): MockMedia {
  return { id, type: "audio", url: mediaImage(seed + "-audio", 800, 320, "butter"), alt };
}

export const MOCK_LOVIS: MockLovi[] = [
  // ===== Mascotas propias de Abril (siempre visibles) =====
  {
    id: "lovi-01",
    petId: "pet-vitto",
    title: "El primer día en el jardín",
    description:
      "Lo sacamos por la mañana temprano, con el pasto todavía frío. Se quedó mirando una pala como si fuera el enemigo.",
    createdAt: "2026-09-30T09:12:00.000Z",
    media: [img("m-01-1", "v1", "Vitto en el jardín")],
  },
  {
    id: "lovi-02",
    petId: "pet-milo",
    title: "Se quedó dormido en el sillón",
    description:
      "Lo encontré en EXACTAMENTE el cuadrado de sol que le toca. No me moví en dos horas.",
    createdAt: "2026-09-28T16:40:00.000Z",
    media: [img("m-02-1", "m1", "Milo dormido"), img("m-02-2", "m2", "Sillón con sol"), img("m-02-3", "m3", "Detalle")],
  },
  {
    id: "lovi-03",
    petId: "pet-luna",
    title: "La caja nueva",
    description: "Llegó de la tienda y en diez minutos ya era suya. Evidentemente no consultó.",
    createdAt: "2026-09-27T11:05:00.000Z",
    media: [img("m-03-1", "l1", "Luna en la caja")],
  },
  {
    id: "lovi-04",
    petId: "pet-vitto",
    title: "Nadar es su segundo nombre",
    description:
      "El.char de pileta ya tiene dueño y no piensa compartirlo. Le sacamos tres fotos seguidas y todas son la misma pose con más pelo mojado.",
    createdAt: "2026-09-25T18:22:00.000Z",
    media: [img("m-04-1", "v2", "Vitto en la pileta"), img("m-04-2", "v3", "Salpicando")],
  },
  {
    id: "lovi-05",
    petId: "pet-milo",
    title: "Un thinking de seasons",
    description: "No sé qué estaba pensando. Escríbelo acá para no olvidarlo.",
    createdAt: "2026-09-24T20:15:00.000Z",
    media: [],
  },
  {
    id: "lovi-06",
    petId: "pet-luna",
    title: "Se subió al estante más alto",
    description:
      "No sé cómo llegó ahí. No le interesan mis razones.",
    createdAt: "2026-09-22T13:30:00.000Z",
    media: [img("m-06-1", "l2", "Luna en el estante")],
  },

  // ===== Mascotas de otros usuarios (visibles solo si se siguen) =====
  {
    id: "lovi-07",
    petId: "pet-mora",
    title: "Corriendo en círculos",
    description:
      "Antes de dormir, siempre. Como si elborder collie tuviera un ritual que no nos quiera contar.",
    createdAt: "2026-09-29T21:50:00.000Z",
    media: [video("m-07-1", "mo1", "Mora corriendo")],
  },
  {
    id: "lovi-08",
    petId: "pet-coco",
    title: "Posición oficial: hombros",
    description: "La encontré así cuando llegué. No pregunté.",
    createdAt: "2026-09-26T19:10:00.000Z",
    media: [img("m-08-1", "co1", "Coco en los hombros"), img("m-08-2", "co2", "Mirada de Coco")],
  },
  {
    id: "lovi-09",
    petId: "pet-nina",
    title: "Su primer huerto",
    description:
      "Le plantamos lechuga y en una semana ya estaba limpio. El,huerto de Nina es un concepto relativo.",
    createdAt: "2026-09-28T08:44:00.000Z",
    media: [img("m-09-1", "ni1", "Nina comiendo lechuga")],
  },
  {
    id: "lovi-10",
    petId: "pet-roco",
    title: "Dijo 'chau' y era para mí",
    description: "Le doy chai, dice. Chai, dice. Lo repito por lo menos veinte veces por día.",
    createdAt: "2026-09-23T15:00:00.000Z",
    media: [audio("m-10-1", "ro1", "El loro hablando")],
  },
  {
    id: "lovi-11",
    petId: "pet-mora",
    title: "El truco del crate",
    description:
      "Aprendió a abrir la cerradura. Estoy BCP listo para Famous cuando pase eso. Le sacamos un video para el registro.",
    createdAt: "2026-09-20T17:35:00.000Z",
    media: [video("m-11-1", "mo2", "Mora abriendo el crate")],
  },
  {
    id: "lovi-12",
    petId: "pet-coco",
    title: "Siete meses de cafe",
    description: "Cumpleañera de café con patas blancas. Le compramos una fuente y la ignoró por completo.",
    createdAt: "2026-09-17T10:20:00.000Z",
    media: [img("m-12-1", "co3", "Coco en la fuente"), img("m-12-2", "co4", "Detalle de la pata"), img("m-12-3", "co5", "Mirada de cumpleaños")],
  },
  {
    id: "lovi-13",
    petId: "pet-nina",
    title: "Oreja caída, corazón entero",
    description: "La levanté para la foto y la volvió a bajar a los dos segundos. Respeto.",
    createdAt: "2026-09-15T12:00:00.000Z",
    media: [img("m-13-1", "ni2", "Retrato de Nina")],
  },
  {
    id: "lovi-14",
    petId: "pet-roco",
    title: "Silencio absoluto",
    description:
      "Hoy no dijo nada en todo el día. Para un loro, eso equivale a un silencio muy elocuente. No sé bien lo que quiso decir, pero lo respeto.",
    createdAt: "2026-09-12T09:30:00.000Z",
    media: [],
  },
  {
    id: "lovi-15",
    petId: "pet-bruno",
    title: "El paseo del veterano",
    description:
      "Caminamos veinte minutos. Para él fue una expedición. Volvió y durmió catorce horas.",
    createdAt: "2026-09-14T18:45:00.000Z",
    media: [img("m-15-1", "br1", "Bruno caminando")],
  },

  // ===== Mascotas de la viewer actual, segunda tanda (más antiguas) =====
  {
    id: "lovi-16",
    petId: "pet-vitto",
    title: "Cumpleaños tres",
    description: "Le compramos un pastel. Se lo comió sin ceremonias y después durmió seis horas.",
    createdAt: "2026-09-10T20:00:00.000Z",
    media: [img("m-16-1", "v4", "Vitto con el pastel"), img("m-16-2", "v5", "Restos del pastel")],
  },
  {
    id: "lovi-17",
    petId: "pet-luna",
    title: "Tres fotos, misma caja",
    description: "No me preguntes por qué. Es parte del proceso.",
    createdAt: "2026-09-08T21:10:00.000Z",
    media: [img("m-17-1", "l3", "Luna en la caja"), img("m-17-2", "l4", "Caja de cerca"), img("m-17-3", "l5", "Otra caja")],
  },
  {
    id: "lovi-18",
    petId: "pet-milo",
    title: "El tackle",
    description:
      "Cayó del sillón en pleno salto. Lo miró como si el sillón lo hubiera empujado. Nadie dijo nada.",
    createdAt: "2026-09-05T14:25:00.000Z",
    media: [video("m-18-1", "m3", "Milo tackling")],
  },
  {
    id: "lovi-19",
    petId: "pet-vitto",
    title: "Visita al veterinario",
    description: "Se portó increíble. Leukupack un premio y ahora cree que el consultorio es un parque.",
    createdAt: "2026-09-01T16:00:00.000Z",
    media: [img("m-19-1", "v6", "Vitto en el consultorio")],
  },
  {
    id: "lovi-20",
    petId: "pet-luna",
    title: "Luna y el papel de cocina",
    description: "Treinta segundos de gloria. Después, veinte minutos recogiendo.",
    createdAt: "2026-08-29T19:30:00.000Z",
    media: [video("m-20-1", "l6", "Luna con el rollo")],
  },
  {
    id: "lovi-21",
    petId: "pet-milo",
    title: "Cinco años",
    description: "Cinco. Parece mentira. Se acuesta en el sillón desde que era chico y el sillón ya se rindió.",
    createdAt: "2026-08-25T10:00:00.000Z",
    media: [img("m-21-1", "m4", "Retrato de Milo")],
  },

  // ===== Más mascotas ajenas para que el feed crezca al seguir =====
  {
    id: "lovi-22",
    petId: "pet-chispa",
    title: "Estante alto, conquista total",
    description: "Llegó arriba de un salto. No sé de dónde sacó la confianza.",
    createdAt: "2026-09-30T11:30:00.000Z",
    media: [img("m-22-1", "ch1", "Chispa en el estante")],
  },
  {
    id: "lovi-23",
    petId: "pet-teo",
    title: "Se acomodó en diez segundos",
    description: "Llegó, se dio vuelta dos veces y se durmió. Eficiencia pura.",
    createdAt: "2026-09-27T15:20:00.000Z",
    media: [img("m-23-1", "te1", "Teo acomodado")],
  },
  {
    id: "lovi-24",
    petId: "pet-nube",
    title: "Bocatel y sol, combo perfecto",
    description: "El plan de la tarde de todos los veranos de mi vida.",
    createdAt: "2026-09-24T16:45:00.000Z",
    media: [img("m-24-1", "nu1", "Nube al sol"), img("m-24-2", "nu2", "Nube de perfil")],
  },
  {
    id: "lovi-25",
    petId: "pet-pipi",
    title: "Puppy finds the toilet",
    description: "Bebió del agua del inodoro. Aprendió rápido y ya no pide permiso.",
    createdAt: "2026-09-21T09:05:00.000Z",
    media: [video("m-25-1", "pi1", "Pippi behaviours")],
  },
  {
    id: "lovi-26",
    petId: "pet-mochi",
    title: "Dos años, cero Older Wisdom",
    description: "Mochi cree que todas las bolsas de|del mercado son suyas. Y técnicamente tiene razón.",
    createdAt: "2026-09-19T13:15:00.000Z",
    media: [img("m-26-1", "mo2", "Mochi en una bolsa")],
  },
  {
    id: "lovi-27",
    petId: "pet-bruno",
    title: "Elveterano y el banco",
    description: "Se sentó, cerró los ojos y no se movió en una hora. Un señor.",
    createdAt: "2026-09-09T11:40:00.000Z",
    media: [img("m-27-1", "br2", "Bruno en el banco")],
  },
  {
    id: "lovi-28",
    petId: "pet-teo",
    title: "Sonrisa obligatoria",
    description: "Le dije 'chau' a la cámara y le sonrió como si supiera lo que hacía. No lo sabía.",
    createdAt: "2026-09-04T17:55:00.000Z",
    media: [img("m-28-1", "te2", "Teo sonriendo"), img("m-28-2", "te3", "Detalle del hocico")],
  },
  {
    id: "lovi-29",
    petId: "pet-nube",
    title: "Historia mínima",
    description: "Hoy la vi en la ventana, como siempre. La fotografié, como siempre. No pasó nada, como siempre. Y estuvo bien.",
    createdAt: "2026-09-02T18:05:00.000Z",
    media: [],
  },
  {
    id: "lovi-30",
    petId: "pet-chispa",
    title: "Caja de cartón, Edición Deluxe",
    description: "La 내가.array destructuring más grande que encontré. No la voy a tirar nunca.",
    createdAt: "2026-08-31T20:30:00.000Z",
    media: [img("m-30-1", "ch2", "Chispa en la caja"), img("m-30-2", "ch3", "Caja desde arriba"), img("m-30-3", "ch4", "Chispa adentro")],
  },
];
