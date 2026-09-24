import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LoviCard } from "@/components/lovi-card";
import { getPet, getPetLovis } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function PetMemoriesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const pet = await getPet(supabase, id);
  if (!pet) notFound();

  // getPetLovis ya ordena por created_at desc: más reciente primero.
  const lovis = await getPetLovis(supabase, pet.pet_id);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <Link
          href={`/pets/${pet.pet_id}`}
          className="btn-ghost-ink !px-2 !py-1 text-[11px]"
        >
          <ChevronLeft size={16} />
          Mascota
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="sticker bg-orange text-ink">recuerdos de</p>
            <h1 className="lovi-headline mt-3">{pet.pet_name}</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
              {lovis.length} {lovis.length === 1 ? "recuerdo" : "recuerdos"}
            </p>
          </div>
          <Link href={`/loviar?pet=${pet.pet_id}`} className="btn-loviar">
            + Loviar recuerdo
          </Link>
        </div>
      </header>

      {lovis.length === 0 ? (
        <EmptyState
          tone="fucsia"
          title={`Todavía no hay recuerdos con ${pet.pet_name}.`}
          description="Un paseo, una siesta, ese video inolvidable… quedan guardados para siempre."
          cta="Loviar el primero"
          href={`/loviar?pet=${pet.pet_id}`}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {lovis.map((lovi, i) => (
            <LoviCard
              key={lovi.lovi_id}
              lovi={lovi}
              showPet={false}
              canDelete
              className={
                i % 2 === 0
                  ? "md:rotate-[0.4deg] hover:rotate-0"
                  : "md:rotate-[-0.4deg] hover:rotate-0"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}