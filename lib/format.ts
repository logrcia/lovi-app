import type { Pet } from "./types";

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** yyyy-mm-dd a partir de un ISO date/time en UTC. Determinístico para el journal. */
export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = MONTHS_ES[d.getUTCMonth()];
  const year = d.getUTCFullYear().toString().slice(-2);
  return `${day} ${month} '${year}`;
}

export function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return `${DAYS_ES[d.getUTCDay()]} ${d.getUTCDate()} de ${MONTHS_ES[d.getUTCMonth()]}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function monthLabel(year: number, month0: number): string {
  return `${MONTHS_ES[month0].charAt(0).toUpperCase()}${MONTHS_ES[month0].slice(1)} ${year}`;
}

export function weekdayShort(index0Sunday: number): string {
  return DAYS_ES[index0Sunday].slice(0, 2);
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Primer día del mes como Date local (para armar la grilla del calendario). */
export function monthStart(year: number, month0: number): Date {
  return new Date(year, month0, 1);
}

/** Días que tiene un mes. */
export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** Index de la semana con lunes como primer día: 0=lunes … 6=domingo. */
export function weekdayIndexMonday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Edad legible a partir de la fecha de nacimiento. */
export function petAge(pet: Pick<Pet, "birth_date">): string | null {
  if (!pet.birth_date) return null;
  const birth = parseDateKey(dateKey(pet.birth_date));
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    if (months <= 0) return "recién llegado/a";
    return months === 1 ? "1 mes" : `${months} meses`;
  }
  if (years === 1) return "1 año";
  return `${years} años`;
}

export function pluralize(name: string, count: number, singular: string, plural: string): string {
  return `${name} · ${count} ${count === 1 ? singular : plural}`;
}