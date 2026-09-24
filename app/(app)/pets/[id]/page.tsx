import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderHeart, Syringe, Stethoscope, Camera } from "lucide-react";

import { PetImage } from "@/components/pet-image";
import { getAlbumsWithCount, getAppointments, getPet, getPetLovis, getVaccines } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatFullDate, petAge } from "@/lib/format";

export const instant = false;

export const metadata: Metadata = {
  title: "Mascota · Lovi",
};

type Props = { params: Promise<{ id: string }> };

const SECTIONS = [
  { key: "lovis", label: "Recuerdos", Icon: Camera, tone: "bg-orange" },
  { key: "albums", label: "Álbumes", Icon: FolderHeart, tone: "bg-butter" },
  { key: "vaccines", label: "Vacunas", Icon: Syringe, tone: "bg-navy" },
  { key: "appointments", label: "Turnos", Icon: Stethoscope, tone: "bg-fucsia" },
] as const;

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const pet = await getPet(supabase, id);
  if (!pet) notFound();

  const [lovis, albums, vaccines, appointments] = await Promise.all([
    getPetLovis(supabase, pet.pet_id),
    getAlbumsWithCount(supabase, pet.pet_id),
    getVaccines(supabase, pet.pet_id),
    getAppointments(supabase, pet.pet_id),
  ]);

  const counts: Record<(typeof SECTIONS)[number]["key"], number> = {
    lovis: lovis.length,
    albums: albums.length,
    vaccines: vaccines.length,
    appointments: appointments.length,
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header compacto sin overlap: la foto vive en su propia caja con
          bordes, sin absolute ni márgenes negativos. */}
      <header className="card-lovi mb-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <PetImage
          name={pet.pet_name}
          src={pet.image}
          className="h-44 w-44 shrink-0 rounded-2xl"
          imgClassName="h-full w-full rounded-2xl"
          tone="bg-orange"
        />
        <div className="min-w-0 flex-1">
          <p className="sticker bg-butter text-ink">mi mascota</p>
          <h1 className="lovi-headline mt-3">{pet.pet_name}</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
            {pet.especie}
            {pet.birth_date ? ` · nació el ${formatFullDate(pet.birth_date)}` : ""}
            {petAge(pet) ? ` · ${petAge(pet)}` : ""}
          </p>
          {pet.description ? (
            <p className="mt-3 text-sm leading-relaxed text-ink/85 line-clamp-2">
              {pet.description}
            </p>
          ) : null}
        </div>
        <Link
          href={`/pets/${pet.pet_id}/edit`}
          className="btn-ink self-start sm:ml-auto sm:self-center"
        >
          Editar
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map(({ key, label, Icon, tone }) => {
          const count = counts[key];
          const target =
            key === "lovis"
              ? `/pets/${pet.pet_id}/memories`
              : `/pets/${pet.pet_id}/${key === "albums" ? "albums" : key === "vaccines" ? "vaccines" : "appointments"}`;
          return (
            <Link
              key={key}
              href={target}
              className={`card-lovi flex flex-col gap-3 px-4 py-4 transition-transform hover:-translate-y-1 ${
                key === "lovis" ? "hover:rotate-1" : "hover:rotate-[-1deg]"
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink ${tone}`}>
                <Icon size={20} strokeWidth={2.25} />
              </span>
              <span>
                <span className="block font-display text-xl font-semibold leading-tight text-ink">
                  {label}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-ink/55">
                  {count === 0
                    ? key === "lovis"
                      ? "todavía nada"
                      : "empezá acá"
                    : `${count} ${count === 1 ? "registro" : "registros"}`}
                </span>
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}