import { notFound } from "next/navigation";
import Link from "next/link";

import { PetImage } from "@/components/pet-image";
import { PetForm } from "@/components/pet-form";
import { getPetForEdit } from "@/lib/queries";
import { signPetImage } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function EditPetPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // getPetForEdit devuelve el path crudo (para persistir); la preview se firma.
  const pet = await getPetForEdit(supabase, id);
  if (!pet) notFound();

  const previewUrl = pet.image ? await signPetImage(supabase, pet.image) : null;

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-8">
        <p className="sticker bg-orange text-ink">modo edición</p>
        <h1 className="lovi-headline mt-3">
          Editar a <span className="italic text-fucsia">{pet.pet_name}</span>
        </h1>
        <Link href={`/pets/${pet.pet_id}`} className="mt-2 inline-block text-sm font-semibold text-ink/70 underline-offset-4 hover:underline">
          ← Volver a su perfil
        </Link>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <PetImage
          name={pet.pet_name}
          src={previewUrl}
          className="h-16 w-16 rounded-xl"
          imgClassName="h-full w-full rounded-xl"
          tone="bg-butter"
        />
        <p className="text-sm text-muted-foreground">
          Vas a poder cambiar la foto, el nombre y los datos de {pet.pet_name}.
        </p>
      </div>

      <PetForm pet={pet} previewUrl={previewUrl} />
    </div>
  );
}