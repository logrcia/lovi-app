import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ProtoAlbumDetail } from "@/components/proto-album-detail";
import {
  getMockAlbum,
  getMockAlbumParams,
  getMockPet,
} from "@/lib/mock-data";

export function generateStaticParams() {
  return getMockAlbumParams();
}

export const metadata = {
  title: "Álbum · prototipo Lovi",
};

/**
 * Detalle de un álbum del prototipo.
 *
 * El 404 cubre dos casos: mascota inexistente y álbum inexistente O que no
 * pertenezca a la mascota (getMockAlbum valida la pertenencia petId ↔
 * álbum, la misma regla que en la app real resuelve la query con un join).
 */
export default async function ProtoAlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string; albumId: string }>;
}) {
  const { id, albumId } = await params;
  if (!getMockPet(id)) notFound();
  if (!getMockAlbum(id, albumId)) notFound();

  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-ink/60">
          Cargando álbum…
        </p>
      }
    >
      <ProtoAlbumDetail petId={id} albumId={albumId} />
    </Suspense>
  );
}
