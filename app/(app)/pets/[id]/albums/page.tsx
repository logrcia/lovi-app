import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { DeleteAlbumButton } from "@/components/delete-album-button";
import { getAlbumsWithCount, getPet } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function AlbumsListPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const [pet, albums] = await Promise.all([
    getPet(supabase, id),
    getAlbumsWithCount(supabase, id),
  ]);
  if (!pet) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sticker bg-butter text-ink">álbumes</p>
          <h1 className="lovi-headline mt-3">
            Álbumes de <span className="italic text-fucsia">{pet.pet_name}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Juntá sus recuerdos por etapas: cachorro, viajes, la playa…
          </p>
        </div>
        <Link href={`/pets/${pet.pet_id}/albums/new`} className="btn-loviar">
          + Crear álbum
        </Link>
      </header>

      {albums.length === 0 ? (
        <EmptyState
          tone="navy"
          title="Todavía no hay álbumes"
          description={`Creá el primero para ${pet.pet_name} y empezá a agrupar sus recuerdos.`}
          cta="Crear álbum"
          href={`/pets/${pet.pet_id}/albums/new`}
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {albums.map((album, i) => (
            <li key={album.album_id}>
              <Link
                href={`/pets/${pet.pet_id}/albums/${album.album_id}`}
                className={`card-lovi flex h-full flex-col justify-between gap-6 px-5 py-5 transition-transform hover:-translate-y-1 ${
                  i % 2 === 0 ? "md:rotate-[0.5deg]" : "md:rotate-[-0.5deg]"
                }`}
              >
                <div>
                  <h2 className="font-display text-2xl font-semibold leading-tight text-ink">
                    {album.title}
                  </h2>
                  {album.description ? (
                    <p className="mt-2 text-sm text-ink/75">{album.description}</p>
                  ) : null}
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
                  {album.lovis_count} {album.lovis_count === 1 ? "recuerdo" : "recuerdos"}
                </span>
              </Link>
              <DeleteAlbumButton petId={pet.pet_id} albumId={album.album_id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}