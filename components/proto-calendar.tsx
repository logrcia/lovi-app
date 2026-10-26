"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  getMockCalendarMarks,
  getMockCalendarPetIds,
  getMockEventTone,
  getMockMonthCells,
  pickDominantEventKind,
  MOCK_EVENT_PRIORITY,
  MOCK_WEEKDAYS,
  type MockCalendarMark,
} from "@/lib/mock-data/pet-sections";
import { CURRENT_MOCK_USER_ID } from "@/lib/mock-data";
import { monthLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Calendario del prototipo: una sola grilla con TODAS las mascotas del
 * usuario, cada marca identificada por petId/petName para poder distinguirlas.
 *
 * Es PRIVADO: solo entra el calendario propio. No incluye las mascotas que el
 * usuario sigue, porque el calendario es informacion personal. Por eso no
 * depende de useMockFollows.
 *
 * El color codifica el TIPO DE EVENTO (getMockEventTone), no la mascota: fucsia
 * es turno, naranja es vacuna, butter es recuerdo/cumple. La mascota se lee en
 * texto, en el title de cada marca y en el listado de abajo. Pintar por
 * mascota llenaba la grilla de tonos sin significado util.
 */

const KIND_LABEL: Record<MockCalendarMark["kind"], string> = {
  lovi: "recuerdo",
  appointment: "turno",
  vaccine: "vacuna",
  birthday: "cumple",
};

/** Leyenda y listado comparten este orden: turno, vacuna, recuerdo, cumple. */
const KIND_ORDER: MockCalendarMark["kind"][] = MOCK_EVENT_PRIORITY;

function shiftMonth(year: number, month0: number, delta: number) {
  const d = new Date(Date.UTC(year, month0 + delta, 1));
  return { year: d.getUTCFullYear(), month0: d.getUTCMonth() };
}

export function ProtoCalendar() {
  const sp = useSearchParams();
  const now = new Date();

  const raw = sp.get("month") ?? "";
  const parsed = raw.split("-").map(Number);
  const year =
    raw && parsed[0] && !Number.isNaN(parsed[0]) ? parsed[0] : now.getFullYear();
  const month0 =
    raw && parsed[1] && parsed[1] >= 1 && parsed[1] <= 12
      ? parsed[1] - 1
      : now.getMonth();

  const ownPetIds = getMockCalendarPetIds(CURRENT_MOCK_USER_ID);
  const marks = getMockCalendarMarks(year, month0, ownPetIds);

  const byDay = new Map<string, MockCalendarMark[]>();
  for (const m of marks) {
    const list = byDay.get(m.date) ?? [];
    list.push(m);
    byDay.set(m.date, list);
  }

  const cells = getMockMonthCells(year, month0);
  const prev = shiftMonth(year, month0, -1);
  const next = shiftMonth(year, month0, 1);
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const monthHref = (y: number, m0: number) =>
    `/proto/calendar?month=${y}-${String(m0 + 1).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="sticker bg-navy text-cream">calendario</p>
        <h1 className="lovi-headline mt-3 !text-4xl">Tu mes</h1>
        <p className="mt-2 text-sm text-ink/70">
          Turnos, vacunas agendadas, recuerdos y cumpleaños de tus mascotas.
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-ink/40">
          privado · solo vos lo ves
        </p>
      </header>

      <div className="card-lovi p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={monthHref(prev.year, prev.month0)}
            aria-label="Mes anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-parchment transition-transform hover:-translate-x-0.5"
          >
            <ChevronLeft size={17} strokeWidth={2.5} />
          </Link>

          <p className="font-display text-2xl font-semibold capitalize text-ink">
            {monthLabel(year, month0)}
          </p>

          <Link
            href={monthHref(next.year, next.month0)}
            aria-label="Mes siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-parchment transition-transform hover:translate-x-0.5"
          >
            <ChevronRight size={17} strokeWidth={2.5} />
          </Link>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {MOCK_WEEKDAYS.map((w) => (
            <div
              key={w}
              className="pb-1 text-center text-[9px] font-bold uppercase tracking-widest text-ink/50"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.inMonth) {
              return <div key={`pad-${i}`} aria-hidden className="h-16" />;
            }
            const dayMarks = byDay.get(cell.date) ?? [];
            const isToday = cell.date === todayKey;

            // El color de la celda es el del evento DOMINANTE del dia
            // (turno > vacuna > cumple > recuerdo). Los puntos de abajo
            // pueden mezclar tipos: cada punto lleva el suyo.
            const dominant = pickDominantEventKind(dayMarks);
            const tone = dominant ? getMockEventTone(dominant) : null;

            const cellTone =
              dominant && tone
                ? cn("border-ink", tone.bg)
                : dayMarks.length > 0
                  ? "border-ink/45 bg-cream/60"
                  : "border-transparent bg-parchment/40";

            // HOY no pisa el color: si el dia de hoy tiene un turno, tiene que
            // seguir leyendose como turno. El dia de hoy se marca con un anillo.
            const todayRing = isToday ? "ring-2 ring-ink" : "";

            const numTone = cn(
              "text-xs",
              dominant && tone ? cn("font-bold", tone.on) : "text-ink/70",
              isToday && "underline decoration-2 underline-offset-2",
            );

            return (
              <div
                key={cell.date}
                className={cn(
                  "flex h-16 flex-col items-center justify-start gap-1 rounded-lg border-2 p-1.5",
                  cellTone,
                  todayRing,
                )}
              >
                <span className={numTone}>{cell.day}</span>
                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {dayMarks.slice(0, 4).map((m, j) => {
                    const dotTone = getMockEventTone(m.kind);
                    const title = `${m.petName} · ${KIND_LABEL[m.kind]}: ${m.label}`;
                    return (
                      <span
                        key={`${m.petId}-${m.kind}-${j}`}
                        title={title}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          dotTone.bg,
                          // Sobre su propio color el punto se pierde: el anillo
                          // crema lo separa del fondo de la celda.
                          dominant && dotTone.bg === tone?.bg && "ring-1 ring-cream",
                        )}
                      />
                    );
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda de TIPOS: el color ES el tipo de evento. Antes listaba las
          mascotas, que era justo el eje que se decidio sacar del color. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        {KIND_ORDER.map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-ink/30",
                getMockEventTone(k).bg,
              )}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/65">
              {KIND_LABEL[k]}
            </span>
          </span>
        ))}
      </div>
      <section className="mt-6">
        <h2 className="mb-3 font-display text-2xl font-semibold text-ink">
          En este mes
        </h2>
        {marks.length === 0 ? (
          <p className="card-lovi px-5 py-6 text-center text-sm text-ink/60">
            No hay turnos, vacunas, recuerdos ni cumpleaños en este mes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {marks.map((m, i) => (
              <li
                key={`${m.date}-${m.petId}-${m.kind}-${i}`}
                className="card-lovi flex items-center gap-3 px-4 py-2.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-8 w-1.5 shrink-0 rounded-full",
                    getMockEventTone(m.kind).bg,
                  )}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">
                  {m.date.slice(8)}/{m.date.slice(5, 7)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink/85">
                    {m.label}
                  </span>
                  {/* De quien es, siempre: la mascota viaja en texto porque el
                      color ya lo ocupa el tipo de evento. */}
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/50">
                    {m.petName} · {KIND_LABEL[m.kind]}
                  </span>
                </span>
                <span className="shrink-0">
                  <span
                    className={cn(
                      "sticker",
                      getMockEventTone(m.kind).bg,
                      getMockEventTone(m.kind).on,
                    )}
                  >
                    {KIND_LABEL[m.kind]} · {m.petName}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35">
        datos simulados · sin escritura
      </p>
    </div>
  );
}
