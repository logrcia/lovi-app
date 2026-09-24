import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CalLabel } from "@/components/cal-label";
import { DayDetail } from "@/components/day-detail";
import {
  daysInMonth,
  weekdayIndexMonday,
  monthLabel,
  dateKey,
  pad2,
} from "@/lib/format";
import {
  getDayAppointments,
  getDayBirthdays,
  getDayLovis,
  getDayVaccines,
  getMonthCalendarMarks,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { CalendarMark } from "@/lib/types";
import { cn } from "@/lib/utils";

export const instant = false;

type Props = {
  searchParams: Promise<{ month?: string; day?: string }>;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const KIND_DOT: Record<CalendarMark["kind"], string> = {
  lovi: "bg-orange",
  vaccine: "bg-navy",
  appointment: "bg-fucsia",
  birthday: "bg-butter",
};

export default async function CalendarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const now = new Date();

  // Mes: yyyy-mm ó el actual
  const [pYear, pMonth] = (sp.month ?? `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`)
    .split("-")
    .map(Number);
  const year = pYear && !isNaN(pYear) ? pYear : now.getFullYear();
  const month0 = pMonth && pMonth >= 1 && pMonth <= 12 ? pMonth - 1 : now.getMonth();
  const key = `${year}-${pad2(month0 + 1)}`;

  const supabase = await createClient();
  const marks = await getMonthCalendarMarks(supabase, year, month0);
  const byDay = new Map<string, CalendarMark[]>();
  for (const m of marks) {
    const list = byDay.get(m.date) ?? [];
    list.push(m);
    byDay.set(m.date, list);
  }

  // Día seleccionado
  const dayKey = sp.day && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : null;
  const [dayLovis, dayVaccines, dayAppointments, dayBirthdays] = dayKey
    ? await Promise.all([
        getDayLovis(supabase, dayKey),
        getDayVaccines(supabase, dayKey),
        getDayAppointments(supabase, dayKey),
        getDayBirthdays(supabase, dayKey),
      ])
    : [[], [], [], []];

  // Grilla (lunes primero)
  const offset = weekdayIndexMonday(new Date(year, month0, 1));
  const totalDays = daysInMonth(year, month0);
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = new Date(year, month0 - 1, 1);
  const nextMonth = new Date(year, month0 + 1, 1);
  const todayK = dateKey(now.toISOString());

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sticker bg-navy text-cream">tu calendario privado</p>
          <h1 className="lovi-headline mt-3">Calendario de recuerdos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lovi, vacunas, turnos y cumpleaños, día por día. Tocá un día para
            ver el detalle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prevMonth.getFullYear()}-${pad2(prevMonth.getMonth() + 1)}`}
            className="btn-ghost-ink !px-2"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </Link>
          <span className="px-2 font-display text-lg font-semibold text-ink">
            {monthLabel(year, month0)}
          </span>
          <Link
            href={`/calendar?month=${nextMonth.getFullYear()}-${pad2(nextMonth.getMonth() + 1)}`}
            className="btn-ghost-ink !px-2"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </header>

      <div className="card-lovi overflow-hidden">
        <div className="grid grid-cols-7 border-b-2 border-ink bg-cream/60">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-ink/60"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (cell === null) {
              return <div key={`empty-${i}`} className="min-h-16 border-r border-b border-ink/10 last:border-r-0" />;
            }
            const dKey = `${key}-${pad2(cell)}`;
            const dayMarks = byDay.get(dKey) ?? [];
            const isToday = dKey === todayK;
            const isSelected = dayKey === dKey;
            return (
              <Link
                key={dKey}
                href={`/calendar?month=${key}&day=${dKey}`}
                className={cn(
                  "flex min-h-16 flex-col gap-1.5 border-r border-b border-ink/10 p-1.5 transition-colors last:border-r-0 hover:bg-cream",
                  isSelected && "bg-butter",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex h-6 w-6 items-center justify-center font-display text-sm font-bold",
                    isToday ? "text-fucsia underline decoration-2 underline-offset-2" : "text-ink/75",
                  )}
                >
                  {cell}
                </span>
                {dayMarks.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {dayMarks.slice(0, 3).map((m, mi) => (
                      <span
                        key={`${dKey}-${mi}`}
                        title={`${m.label} · ${m.pet_name}`}
                        className={cn("h-2 w-2 rounded-full", KIND_DOT[m.kind])}
                      />
                    ))}
                    {dayMarks.length > 3 ? (
                      <span className="text-[9px] font-bold text-ink/50">+{dayMarks.length - 3}</span>
                    ) : null}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <CalLabel kind="lovi" label="Lovi" />
        <CalLabel kind="vaccine" label="Vacuna" />
        <CalLabel kind="appointment" label="Turno" />
        <CalLabel kind="birthday" label="Cumpleaños" />
      </div>

      {dayKey ? <DayDetail dayKey={dayKey} lovis={dayLovis} vaccines={dayVaccines} appointments={dayAppointments} birthdays={dayBirthdays} /> : null}
    </div>
  );
}