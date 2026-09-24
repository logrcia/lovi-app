import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PetImage } from "@/components/pet-image";
import { getPets } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { petAge } from "@/lib/format";

export const instant = false;

export default async function PetsPage() {
  const supabase = await createClient();
  const pets = await getPets(supabase);

  if (pets.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="sticker bg-butter text-ink">mis mascotas</p>
          <h1 className="lovi-headline mt-3">Todavía no agregaste ninguna mascota.</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Contanos quién forma parte de tu vida y empezá a loviar sus recuerdos.
          </p>
        </header>
        <EmptyState
          tone="navy"
          title="Tu primer compañero/a"
          description="Agregá una mascota para empezar su diario: fotos, recuerdos, vacunas y turnos en un solo lugar."
          cta="Agregar mi primera mascota"
          href="/pets/new"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sticker bg-butter text-ink">mis mascotas</p>
          <h1 className="lovi-headline mt-3">
            {pets.length} {pets.length === 1 ? "mascota" : "mascotas"}
          </h1>
        </div>
        <Link href="/pets/new" className="btn-loviar">
          + Agregar mascota
        </Link>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet, i) => (
          <li key={pet.pet_id}>
            <Link
              href={`/pets/${pet.pet_id}`}
              className={`card-lovi flex flex-col overflow-hidden transition-transform hover:-translate-y-1 hover:rotate-0 ${
                i % 2 === 0 ? "md:rotate-[0.5deg]" : "md:rotate-[-0.5deg]"
              }`}
            >
              <PetImage
                name={pet.pet_name}
                src={pet.image}
                className="h-44 w-full rounded-none border-x-0 border-t-0"
                imgClassName="h-full w-full"
                tone={i % 2 === 0 ? "bg-orange" : "bg-navy"}
              />
              <div className="flex flex-1 flex-col gap-1 px-5 py-4">
                <h2 className="font-display text-2xl font-semibold leading-tight text-ink">
                  {pet.pet_name}
                </h2>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
                  {pet.especie}
                  {petAge(pet) ? ` · ${petAge(pet)}` : ""}
                </p>
                {pet.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/80">
                    {pet.description}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}