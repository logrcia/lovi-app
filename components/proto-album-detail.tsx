"use client";

import { FeedCard } from "@/components/feed-card";
import { ProtoBackLink } from "@/components/proto-back-link";
import {
  getMockAlbum,
  getMockAlbumBundle,
  getMockPet,
} from "@/lib/mock-data";
import { useMockFollows } from "@/lib/mock-data/follows";

/**
 * Detalle de un álbum del prototipo: el álbum con sus recuerdos (lovis).
 *
 * Pantalla hermana de proto-pet-profile. La membresía album -> lovis es
 * DATO ESTÁTICO de la semilla (MOCK_ALBUM_LOVIS): los lovis creados en el
 * proto no se agregan a álbumes porque ese flujo no existe en esta fase,
 * así que el bundle no recibe `extraLovis` ni depende del provider de
 * recuerdos creados.
 *
 * Cabecera (back, sticker, título, cover, meta) y lista se gatean distinto:
 * la semilla del álbum es síncrona y pura, se muestra ya; hidratar cada
 * FeedLovi exige saber a quién sigue el viewer, así que la lista espera el
 * `ready` de useMockFollows (mismo criterio que proto-pet-profile).
 */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ProtoAlbumDetail({
  petId,
  albumId,
}: {
  petId: string;
  albumId: string;
}) {
  const { followedPetIds, ready } = useMockFollows();

  const pet = getMockPet(petId);
  const album = getMockAlbum(petId, albumId);

  // Defensivo: la página ya hace notFound() antes de montar esto.
  if (!pet || !album) {
    return (
      <p className="card-lovi px-5 py-8 text-center text-sm text-ink/60">
        Este álbum no existe en el prototipo.
      </p>
    );
  }

  const bundle = ready ? getMockAlbumBundle(petId, albumId, followedPetIds) : null;

  return (
    <div>
      <ProtoBackLink
        label={pet.name.toLowerCase()}
        fallback={`/proto/pets/${petId}/albums`}
      />

      <p className="sticker bg-butter text-ink">álbum</p>
      <h1 className="lovi-headline mt-3">{album.title}</h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={album.cover}
        alt={album.title}
        className="mt-4 h-48 w-full border-2 border-ink object-cover"
      />

      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-ink/55">
        {album.loviCount} {album.loviCount === 1 ? "recuerdo" : "recuerdos"} ·{" "}
        {formatDate(album.createdAt)}
      </p>

      {!ready ? (
        <p className="card-lovi mt-6 px-5 py-8 text-center text-sm text-ink/60">
          Cargando recuerdos…
        </p>
      ) : !bundle || bundle.lovis.length === 0 ? (
        <p className="card-lovi mt-6 px-5 py-8 text-center text-sm text-ink/60">
          Este álbum todavía no tiene recuerdos.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {bundle.lovis.map((lovi, i) => (
            <FeedCard
              key={lovi.id}
              lovi={lovi}
              from={`/proto/pets/${petId}/albums/${albumId}`}
              tilt={i % 2 === 0 ? 1 : -1}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35">
        datos simulados · sin escritura
      </p>
    </div>
  );
}
