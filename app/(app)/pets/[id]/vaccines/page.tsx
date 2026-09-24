import Link from "next/link";
import { notFound } from "next/navigation";
import { Syringe } from "lucide-react";

import { VaccineForm } from "@/components/vaccine-form";
import { DeleteVaccineButton } from "@/components/delete-vaccine-button";
import { getPet, getVaccines } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatFullDate } from "@/lib/format";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function PetVaccinesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const [pet, vaccines] = await Promise.all([getPet(supabase, id), getVaccines(supabase, id)]);
  if (!pet) notFound();

  const grouped = new Map<string, typeof vaccines>();
  const withYear = vaccines.map((v) => ({ ...v, yearKey: v.date.slice(0, 4) }));
  for (const v of withYear) {
    const list = grouped.get(v.yearKey) ?? [];
    list.push(v);
    grouped.set(v.yearKey, list);
  }
  const years = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="sticker bg-navy text-cream">vacunas</p>
        <h1 className="lovi-headline mt-3">
          Vacunas de <span className="italic text-fucsia">{pet.pet_name}</span>
        </h1>
        <Link href={`/pets/${pet.pet_id}`} className="mt-2 inline-block text-sm font-semibold text-ink/70 underline-offset-4 hover:underline">
          ← Volver a su perfil
        </Link>
      </header>

      <div className="mb-10">
        <VaccineForm petId={pet.pet_id} />
      </div>

      {vaccines.length === 0 ? (
        <p className="card-lovi px-5 py-6 text-sm text-muted-foreground">
          Todavía no cargaste ninguna vacuna para {pet.pet_name}. Cuando le
          toque una, la guardás acá y queda marcada en el calendario.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {years.map((year) => (
            <section key={year}>
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">{year}</h2>
              <ul className="flex flex-col gap-3">
                {(grouped.get(year) ?? []).map((v, i) => (
                  <li key={v.vac_id} className={`card-lovi flex items-center gap-4 px-4 py-3 ${i % 2 === 0 ? "md:rotate-[0.2deg]" : "md:rotate-[-0.2deg]"}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-butter">
                      <Syringe size={17} strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFullDate(v.date)}
                        {v.next_dose ? ` · próxima: ${formatFullDate(v.next_dose)}` : ""}
                      </p>
                    </div>
                    <DeleteVaccineButton petId={pet.pet_id} vacId={v.vac_id} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}