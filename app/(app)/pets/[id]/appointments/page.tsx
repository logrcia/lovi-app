import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarHeart } from "lucide-react";

import { AppointmentForm } from "@/components/appointment-form";
import { DeleteAppointmentButton } from "@/components/delete-appointment-button";
import { getPet, getAppointments } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatFullDate, formatTime } from "@/lib/format";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function PetAppointmentsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const [pet, appointments] = await Promise.all([getPet(supabase, id), getAppointments(supabase, id)]);
  if (!pet) notFound();

  const today = new Date().toISOString();
  const upcoming = appointments.filter((a) => a.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = appointments.filter((a) => a.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const renderList = (list: typeof appointments, empty: string) =>
    list.length === 0 ? (
      <p className="text-sm text-muted-foreground">{empty}</p>
    ) : (
      <ul className="flex flex-col gap-3">
        {list.map((a, i) => (
          <li key={a.ap_id} className={`card-lovi flex items-center gap-4 px-4 py-3 ${i % 2 === 0 ? "md:rotate-[0.2deg]" : "md:rotate-[-0.2deg]"}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-fucsia text-cream">
              <CalendarHeart size={17} strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{a.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFullDate(a.date)} · {formatTime(a.date)}
                {a.description ? ` · ${a.description}` : ""}
              </p>
            </div>
            <DeleteAppointmentButton petId={pet.pet_id} apId={a.ap_id} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="sticker bg-fucsia text-cream">turnos</p>
        <h1 className="lovi-headline mt-3">
          Turnos de <span className="italic text-butter">{pet.pet_name}</span>
        </h1>
        <Link href={`/pets/${pet.pet_id}`} className="mt-2 inline-block text-sm font-semibold text-ink/70 underline-offset-4 hover:underline">
          ← Volver a su perfil
        </Link>
      </header>

      <div className="mb-10">
        <AppointmentForm petId={pet.pet_id} />
      </div>

      {appointments.length === 0 ? (
        <p className="card-lovi px-5 py-6 text-sm text-muted-foreground">
          No hay turnos todavía. Veterinaria, peluquería, paseos… guardalos acá
          para no olvidarte.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-ink">Próximos</h2>
            {renderList(upcoming, "No hay turnos próximos.")}
          </section>
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-ink">Pasados</h2>
            {renderList(past, "Todavía no hubo turnos.")}
          </section>
        </div>
      )}
    </div>
  );
}