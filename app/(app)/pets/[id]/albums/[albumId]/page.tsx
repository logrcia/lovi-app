import { notFound } from "next/navigation";
import Link from "next/link";

import { AddLoviToAlbum } from "@/components/add-lovi-to-album";
import { LoviCard } from "@/components/lovi-card";
import { RemoveLoviFromAlbum } from "@/components/remove-lovi-from-album";
import { getAlbum, getPet, getPetLovis } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = { params: Promise<{ id: string; albumId: string }> };

export default async function AlbumDetailPage({ params }: Props) {
  const { id, albumId } = await params;
  const supabase = await createClient();

  const [pet, albumBundle] = await Promise.all([
    getPet(supabase, id),
    getAlbum(supabase, id, albumId),
  ]);
  if (!pet || !albumBundle) notFound();

  const { album, lovis } = albumBundle;

  // Recuerdos de la mascota que todavía no están en el álbum, para el selector.
  const allLovis = await getPetLovis(supabase, id);
  const alreadyIds = new Set(lovis.map((l) => l.lovi_id));
  const available = allLovis.filter((l) => !alreadyIds.has(l.lovi_id));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sticker bg-butter text-ink">álbum</p>
          <h1 className="lovi-headline mt-3">{album.title}</h1>
          {album.description ? (
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{album.description}</p>
          ) : null}
          <Link
            href={`/pets/${pet.pet_id}/albums`}
            className="mt-2 inline-block text-sm font-semibold text-ink/70 underline-offset-4 hover:underline"
          >
            ← Todos los álbumes de {pet.pet_name}
          </Link>
        </div>
      </header>

      <div className="card-lovi mb-10 flex flex-col gap-3 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/60">
          Agregar recuerdos
        </p>
        <AddLoviToAlbum petId={pet.pet_id} albumId={album.album_id} lovis={available} />
      </div>

      {lovis.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Este álbum está vacío. Sumá el primer recuerdo con el selector de
          arriba.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {lovis.map((lovi, i) => (
            <div key={lovi.lovi_id} className="relative">
              <LoviCard
                lovi={lovi}
                className={
                  i % 2 === 0
                    ? "md:rotate-[0.3deg] hover:rotate-0"
                    : "md:rotate-[-0.3deg] hover:rotate-0"
                }
              />
              <div className="absolute right-3 top-14">
                <RemoveLoviFromAlbum
                  petId={pet.pet_id}
                  albumId={album.album_id}
                  loviId={lovi.lovi_id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}