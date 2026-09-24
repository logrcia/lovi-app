import { notFound } from "next/navigation";

import { AlbumForm } from "@/components/album-form";
import { getPet } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function NewAlbumPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const pet = await getPet(supabase, id);
  if (!pet) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-8">
        <p className="sticker bg-butter text-ink">álbum nuevo</p>
        <h1 className="lovi-headline mt-3">
          Álbum para <span className="italic text-fucsia">{pet.pet_name}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un nombre corto y con cariño. Después vas a poder sumarle recuerdos
          loviados.
        </p>
      </header>
      <AlbumForm petId={pet.pet_id} />
    </div>
  );
}