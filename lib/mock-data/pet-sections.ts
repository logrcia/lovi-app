/**
 * Datos simulados de las secciones secundarias de una mascota:
 * Albunes, Vacunas, Turnos y las marcas del Calendario.
 *
 * No hacen falta para el Home ni para el perfil, asi que viven aparte de
 * lovis.ts. Cuando se conecte Supabase, se reemplazan por
 * getAlbumsWithCount / getVaccines / getAppointments, que ya existen hoy en
 * lib/queries.ts.
 *
 * El calendario se arma DERIVANDO de estas mismas fuentes mas los lovis y
 * los cumpleaños, igual que hace getMonthCalendarMarks en la app real.
 * Reutiliza los helpers puros de lib/format.ts (ninguno toca Supabase).
 */

import {
  dateKey,
  daysInMonth,
  pad2,
  weekdayIndexMonday,
} from "@/lib/format";

import { mediaImage } from "./assets";
import { MOCK_LOVIS } from "./lovis";
import { MOCK_PETS } from "./pets";

export type MockAlbum = {
  id: string;
  petId: string;
  title: string;
  cover: string;
  loviCount: number;
  createdAt: string;
};

/**
 * Semilla del álbum SIN el contador: `loviCount` se deriva en las lecturas
 * (ver getMockAlbums / getMockAlbum) a partir de MOCK_ALBUM_LOVIS.
 */
export type MockAlbumSeed = Omit<MockAlbum, "loviCount">;

export type MockVaccine = {
  id: string;
  petId: string;
  name: string;
  appliedAt: string;
  nextDueAt: string | null;
  notes: string | null;
};

export type MockAppointment = {
  id: string;
  petId: string;
  title: string;
  at: string;
  kind: string;
  notes: string | null;
};

/**
 * Marca del calendario. Espejo de CalendarMark en lib/types.ts.
 *
 * petId y petName traveling con la marca: el calendario muestra TODAS las
 * mascotas del usuario en una sola grilla, asi que cada marca tiene que
 * decir de quien es.
 */
export type MockCalendarMark = {
  date: string; // yyyy-mm-dd
  kind: "lovi" | "appointment" | "vaccine" | "birthday";
  label: string;
  petId: string;
  petName: string;
};

/**
 * Color por TIPO de evento, no por mascota.
 *
 * Antes el color codificaba la mascota (getMockPetTint) y el tipo se leia en
 * el texto. Con varias mascotas en la misma grilla eso no escalaba: cinco
 * tonos y ninguno significaba "hay un turno". Ahora el color responde a la
 * pregunta util — ¿que tengo que hacer? — y la mascota viaja en texto, en la
 * marca y en el listado.
 *
 * Cada tono trae su color de texto: si un dia va pintado de color entero hay
 * que garantizar contraste. Un unico color sobre navy o fucsia seria
 * ilegible.
 *
 * El cumple comparte paleta con el recuerdo a proposito: son la misma familia
 * (una fecha de la mascota que no hay que agendar) y una cuarta paleta hacia
 * la grilla mas confusa, que es justo lo que se vino a corregir.
 */
export type MockEventTone = { bg: string; on: string };

export const MOCK_EVENT_TONES: Record<MockCalendarMark["kind"], MockEventTone> =
  {
    appointment: { bg: "bg-fucsia", on: "text-cream" },
    vaccine: { bg: "bg-orange", on: "text-ink" },
    lovi: { bg: "bg-butter", on: "text-ink" },
    birthday: { bg: "bg-butter", on: "text-ink" },
  };

/**
 * Tono estable por tipo de evento. No depende de una instancia ni de un indice:
 * el mismo tipo se ve igual en el mes, en la leyenda y en el listado.
 */
export function getMockEventTone(
  kind: MockCalendarMark["kind"],
): MockEventTone {
  return MOCK_EVENT_TONES[kind];
}

/**
 * Orden de resolvedor de una celda con varios eventos: primero lo que hay que
 * agendar (turno, vacuna), despues las fechas de la mascota (recuerdo, cumple).
 * Asi una celda mixta nunca se muestra como si solo tuviera un recuerdo.
 */
export const MOCK_EVENT_PRIORITY: MockCalendarMark["kind"][] = [
  "appointment",
  "vaccine",
  "birthday",
  "lovi",
];

/** Tipo dominante de un dia: el primero de MOCK_EVENT_PRIORITY que aparece. */
export function pickDominantEventKind(
  marks: readonly MockCalendarMark[],
): MockCalendarMark["kind"] | null {
  for (const kind of MOCK_EVENT_PRIORITY) {
    if (marks.some((m) => m.kind === kind)) return kind;
  }
  return null;
}

export const MOCK_ALBUMS: MockAlbumSeed[] = [
  {
    id: "album-cachorro",
    petId: "pet-vitto",
    title: "Cachorro",
    cover: mediaImage("album-cachorro", 800, 600, "butter"),
    createdAt: "2025-08-10T10:00:00.000Z",
  },
  {
    id: "album-verano",
    petId: "pet-vitto",
    title: "Verano en la costa",
    cover: mediaImage("album-verano", 800, 600, "orange"),
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "album-caja",
    petId: "pet-luna",
    title: "La coleccion de cajas",
    cover: mediaImage("album-caja", 800, 600, "fucsia"),
    createdAt: "2025-11-02T10:00:00.000Z",
  },
  {
    id: "album-atajante",
    petId: "pet-milo",
    title: "Temporada de atajadas",
    cover: mediaImage("album-atajante", 800, 600, "navy"),
    createdAt: "2024-05-20T10:00:00.000Z",
  },
  {
    id: "album-corridas",
    petId: "pet-mora",
    title: "Antes de dormir",
    cover: mediaImage("album-corridas", 800, 600, "orange"),
    createdAt: "2026-03-11T10:00:00.000Z",
  },
  {
    id: "album-huerto",
    petId: "pet-nina",
    title: "El huerto",
    cover: mediaImage("album-huerto", 800, 600, "butter"),
    createdAt: "2025-04-06T10:00:00.000Z",
  },
];

/**
 * Membresía de álbumes: el equivalente mock de la tabla real `album_lovis`.
 *
 * Reglas, mismas que en Supabase:
 *   - solo lovis de LA MISMA mascota del álbum (un álbum nunca cruza mascotas);
 *   - un lovi puede pertenecer a más de un álbum (el join real lo permite).
 *
 * Los contadores sembrados antes en MOCK_ALBUMS (7, 5, 6, 8…) no coincidían
 * con los lovis reales por mascota (2–4): la lista mintía frente al detalle.
 * Por eso `loviCount` ahora se DERIVA de la longitud de esta membresía, y
 * lista y detalle nunca pueden divergir.
 *
 * Los lovis creados en el prototipo NO entran a ningún álbum: no existe
 * flujo de "agregar al álbum" en el proto, la membresía es estática.
 */
export const MOCK_ALBUM_LOVIS: Record<string, readonly string[]> = {
  "album-cachorro": ["lovi-01", "lovi-16", "lovi-19"],
  "album-verano": ["lovi-04"],
  "album-caja": ["lovi-03", "lovi-17"],
  "album-atajante": ["lovi-18"],
  "album-corridas": ["lovi-07"],
  "album-huerto": ["lovi-09"],
};

export const MOCK_VACCINES: MockVaccine[] = [
  {
    id: "vac-1",
    petId: "pet-vitto",
    name: "Antirabica",
    appliedAt: "2026-03-14",
    nextDueAt: "2027-03-14",
    notes: null,
  },
  {
    id: "vac-2",
    petId: "pet-vitto",
    name: "Quinuple",
    appliedAt: "2026-03-14",
    nextDueAt: "2027-03-14",
    notes: "La espero parada, sin moverse.",
  },
  {
    id: "vac-3",
    petId: "pet-vitto",
    name: "Refuerzo anual",
    appliedAt: "2025-10-18",
    nextDueAt: "2026-10-18",
    notes: "Agendada para este mes.",
  },
  {
    id: "vac-4",
    petId: "pet-luna",
    name: "Triple felina",
    appliedAt: "2025-01-08",
    nextDueAt: "2026-01-08",
    notes: "Vencida. Pendiente de agendar.",
  },
  {
    id: "vac-5",
    petId: "pet-luna",
    name: "Antirabica",
    appliedAt: "2025-10-25",
    nextDueAt: "2026-10-25",
    notes: "Agendada para este mes.",
  },
  {
    id: "vac-6",
    petId: "pet-milo",
    name: "Antirabica",
    appliedAt: "2025-11-22",
    nextDueAt: "2026-11-22",
    notes: null,
  },
  {
    id: "vac-7",
    petId: "pet-milo",
    name: "Parvovirus",
    appliedAt: "2026-05-05",
    nextDueAt: "2026-11-05",
    notes: "Segunda dosis del esquema.",
  },
  {
    id: "vac-8",
    petId: "pet-mora",
    name: "Parvovirus",
    appliedAt: "2026-06-02",
    nextDueAt: "2027-06-02",
    notes: null,
  },
  {
    id: "vac-9",
    petId: "pet-nina",
    name: "Mixto",
    appliedAt: "2026-04-30",
    nextDueAt: "2027-04-30",
    notes: null,
  },
];

export const MOCK_APPOINTMENTS: MockAppointment[] = [
  {
    id: "apt-1",
    petId: "pet-vitto",
    title: "Control anual",
    at: "2026-10-06T15:30:00.000Z",
    kind: "veterinario",
    notes: "Vacuna al dia y control de peso.",
  },
  {
    id: "apt-2",
    petId: "pet-luna",
    title: "Corte de unas",
    at: "2026-10-09T11:00:00.000Z",
    kind: "peluqueria",
    notes: null,
  },
  {
    id: "apt-3",
    petId: "pet-milo",
    title: "Vacunacion anual",
    at: "2026-11-22T17:00:00.000Z",
    kind: "vacunacion",
    notes: null,
  },
  {
    id: "apt-4",
    petId: "pet-mora",
    title: "Fisioterapia",
    at: "2026-10-12T10:00:00.000Z",
    kind: "veterinario",
    notes: "Sesion 4 de 8.",
  },
  {
    id: "apt-5",
    petId: "pet-nina",
    title: "Control de peso",
    at: "2026-10-15T16:00:00.000Z",
    kind: "veterinario",
    notes: null,
  },
  {
    id: "apt-6",
    petId: "pet-chispa",
    title: "Desparasitacion",
    at: "2026-10-20T09:30:00.000Z",
    kind: "veterinario",
    notes: null,
  },
];

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

/** Ids de lovis que pertenecen a un álbum (membresía mock). Vacío si no hay. */
export function getMockAlbumLoviIds(albumId: string): readonly string[] {
  return MOCK_ALBUM_LOVIS[albumId] ?? [];
}

/** Semilla del álbum + contador derivado de la membresía. */
function withDerivedCount(seed: MockAlbumSeed): MockAlbum {
  return { ...seed, loviCount: getMockAlbumLoviIds(seed.id).length };
}

/**
 * Álbumes de una mascota, con `loviCount` DERIVADO de MOCK_ALBUM_LOVIS para
 * que el listado siempre muestre el mismo número que el detalle.
 */
export function getMockAlbums(petId: string): MockAlbum[] {
  return MOCK_ALBUMS.filter((a) => a.petId === petId).map(withDerivedCount);
}

/**
 * Un álbum concreto, solo si existe Y pertenece a la mascota indicada.
 * La pertenencia petId ↔ álbum es la misma regla que valida el 404 real.
 */
export function getMockAlbum(petId: string, albumId: string): MockAlbum | null {
  const seed = MOCK_ALBUMS.find((a) => a.id === albumId);
  if (!seed || seed.petId !== petId) return null;
  return withDerivedCount(seed);
}

export function getMockVaccines(petId: string): MockVaccine[] {
  return MOCK_VACCINES.filter((v) => v.petId === petId).sort((a, b) =>
    b.appliedAt.localeCompare(a.appliedAt),
  );
}

export function getMockAppointments(petId: string): MockAppointment[] {
  return MOCK_APPOINTMENTS.filter((a) => a.petId === petId).sort((a, b) =>
    a.at.localeCompare(b.at),
  );
}

/** Turnos de una mascota, separados en futuros y pasados. */
export function getMockAppointmentsSplit(
  petId: string,
  nowIso: string,
): { upcoming: MockAppointment[]; past: MockAppointment[] } {
  const now = new Date(nowIso).getTime();
  const all = getMockAppointments(petId);
  return {
    upcoming: all.filter((a) => new Date(a.at).getTime() >= now),
    past: all.filter((a) => new Date(a.at).getTime() < now).reverse(),
  };
}

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------

/**
 * Marcas de un mes para el calendario: lovis, turnos, vacunas agendadas y
 * cumpleaños, de TODAS las mascotas que se le pasan.
 *
 * Cada marca lleva petId y petName: una sola grilla para varias mascotas, y
 * hay que poder distinguir de quien es cada cosa.
 *
 * De las vacunas solo interesan las AGENDADAS (nextDueAt). Las ya aplicadas
 * no son un evento futuro.
 *
 * @param petIds Mascotas a considerar. Para el calendario del prototipo son
 *   solo las propias (ver getMockCalendarPetIds): el calendario es privado.
 */
export function getMockCalendarMarks(
  year: number,
  month0: number,
  petIds: readonly string[],
): MockCalendarMark[] {
  const allowed = new Set(petIds);
  const nameOf = (petId: string) =>
    MOCK_PETS.find((p) => p.id === petId)?.name ?? petId;
  const inMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getUTCFullYear() === year && d.getUTCMonth() === month0;
  };
  const isVisible = (petId: string) => allowed.has(petId);

  const marks: MockCalendarMark[] = [];

  for (const l of MOCK_LOVIS) {
    if (!inMonth(l.createdAt) || !isVisible(l.petId)) continue;
    marks.push({
      date: dateKey(l.createdAt),
      kind: "lovi",
      label: l.title,
      petId: l.petId,
      petName: nameOf(l.petId),
    });
  }

  for (const a of MOCK_APPOINTMENTS) {
    if (!inMonth(a.at) || !isVisible(a.petId)) continue;
    marks.push({
      date: dateKey(a.at),
      kind: "appointment",
      label: a.title,
      petId: a.petId,
      petName: nameOf(a.petId),
    });
  }

  for (const v of MOCK_VACCINES) {
    if (v.nextDueAt === null || !isVisible(v.petId)) continue;
    if (!inMonth(`${v.nextDueAt}T00:00:00.000Z`)) continue;
    marks.push({
      date: v.nextDueAt,
      kind: "vaccine",
      label: v.name,
      petId: v.petId,
      petName: nameOf(v.petId),
    });
  }

  for (const p of MOCK_PETS) {
    if (!isVisible(p.id)) continue;
    // El cumple se repite todos los años: se compara mes-dia, no el anio
    // completo. Mismo criterio que getDayBirthdays en lib/queries.ts, que
    // hace dateKey(birth_date).slice(5) === monthDay.
    const monthDay = p.birthDate.slice(5);
    const target = `${year}-${monthDay}`;
    const targetMonth = Number(monthDay.slice(0, 2)) - 1;
    if (targetMonth !== month0) continue;
    marks.push({
      date: target,
      kind: "birthday",
      label: p.name,
      petId: p.id,
      petName: p.name,
    });
  }

  return marks.sort((a, b) => a.date.localeCompare(b.date));
}

/** Celdas de la grilla: dias vacios al inicio + dias del mes. */
export function getMockMonthCells(
  year: number,
  month0: number,
): { date: string; day: number; inMonth: boolean }[] {
  const total = daysInMonth(year, month0);
  const lead = weekdayIndexMonday(new Date(year, month0, 1));
  const cells: { date: string; day: number; inMonth: boolean }[] = [];

  for (let i = 0; i < lead; i++) {
    cells.push({ date: "", day: 0, inMonth: false });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({
      date: `${year}-${pad2(month0 + 1)}-${pad2(d)}`,
      day: d,
      inMonth: true,
    });
  }
  return cells;
}

export const MOCK_WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

/**
 * Mascotas del calendario: SOLO las propias del viewer.
 *
 * El calendario es privado. Un usuario no ve el calendario de otro ni el de
 * las mascotas que solo sigue, aunque estas sean publicas. Por eso esta
 * funcion NO mezcla los follows, a diferencia de getMockFeed.
 */
export function getMockCalendarPetIds(
  viewerId: string,
): string[] {
  return MOCK_PETS.filter((p) => p.ownerId === viewerId).map((p) => p.id);
}
