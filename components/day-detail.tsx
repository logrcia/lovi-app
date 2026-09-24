import Link from "next/link";
import { Cake, CalendarHeart, Camera, Syringe } from "lucide-react";

import { LoviCard } from "@/components/lovi-card";
import { formatFullDate, formatTime } from "@/lib/format";
import type { Appointment, LoviWithMedia, Vaccine } from "@/lib/types";
import type { DayBirthdays } from "@/lib/queries";

export function DayDetail({
  dayKey,
  lovis,
  vaccines,
  appointments,
  birthdays,
}: {
  dayKey: string;
  lovis: LoviWithMedia[];
  vaccines: (Vaccine & { pet_name: string })[];
  appointments: (Appointment & { pet_name: string })[];
  birthdays: DayBirthdays;
}) {
  const total =
    lovis.length + vaccines.length + appointments.length + birthdays.length;

  return (
    <section className="mt-6">
      <p className="sticker bg-orange text-ink">detalle del día</p>
      <h2 className="lovi-headline mt-3 text-2xl">{formatFullDate(dayKey)}</h2>

      {total === 0 ? (
        <p className="card-lovi mt-4 px-5 py-6 text-sm text-muted-foreground">
          No hay nada guardado para este día todavía. Podés loviar un recuerdo
          o cargar una vacuna o turno desde el perfil de tu mascota.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {birthdays.length > 0 ? (
            <div className="card-lovi flex items-center gap-4 px-5 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-butter">
                <Cake size={20} strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  {birthdays.length === 1
                    ? `¡Feliz cumpleaños, ${birthdays[0].pet_name}!`
                    : `¡Feliz cumpleaños a ${birthdays.map((b) => b.pet_name).join(" y ")}!`}
                </p>
                <p className="text-xs text-muted-foreground">Es un día especial 🎉</p>
              </div>
            </div>
          ) : null}

          {vaccines.map((v) => (
            <div key={v.vac_id} className="card-lovi flex items-center gap-4 px-5 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-navy text-cream">
                <Syringe size={20} strokeWidth={2.25} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{v.name}</p>
                <p className="text-xs text-muted-foreground">Vacuna · {v.pet_name}</p>
                {v.next_dose ? (
                  <p className="mt-1 text-xs text-ink/70">Próxima dosis: {formatFullDate(v.next_dose)}</p>
                ) : null}
              </div>
              <Link href={`/pets/${v.pet_id}/vaccines`} className="btn-ghost-ink !px-2 !py-1 text-[11px]">
                Ver
              </Link>
            </div>
          ))}

          {appointments.map((a) => (
            <div key={a.ap_id} className="card-lovi flex items-center gap-4 px-5 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-fucsia text-cream">
                <CalendarHeart size={20} strokeWidth={2.25} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  Turno · {a.pet_name} · {formatTime(a.date)}
                </p>
                {a.description ? (
                  <p className="mt-1 text-xs text-ink/70">{a.description}</p>
                ) : null}
              </div>
              <Link href={`/pets/${a.pet_id}/appointments`} className="btn-ghost-ink !px-2 !py-1 text-[11px]">
                Ver
              </Link>
            </div>
          ))}

          {lovis.map((lovi, i) => (
            <div key={lovi.lovi_id} className="relative">
              <span className={`absolute -left-2 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-orange ${i % 2 === 0 ? "rotate-[-6deg]" : "rotate-[6deg]"}`}>
                <Camera size={14} strokeWidth={2.5} />
              </span>
              <LoviCard
                lovi={lovi}
                className={
                  i % 2 === 0
                    ? "md:rotate-[0.3deg] hover:rotate-0"
                    : "md:rotate-[-0.3deg] hover:rotate-0"
                }
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}