import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ProtoPetSection } from "@/components/proto-pet-section";
import { getMockPet, getMockPets } from "@/lib/mock-data";

export function generateStaticParams() {
  return getMockPets().map((p) => ({ id: p.id }));
}

export const metadata = {
  title: "Álbumes · prototipo Lovi",
};

export default async function ProtoPetAlbumsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getMockPet(id)) notFound();
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-ink/60">
          Cargando albums…
        </p>
      }
    >
      <ProtoPetSection petId={id} kind="albums" />
    </Suspense>
  );
}
