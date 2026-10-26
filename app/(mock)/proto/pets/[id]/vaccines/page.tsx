import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ProtoPetSection } from "@/components/proto-pet-section";
import {
  CURRENT_MOCK_USER_ID,
  getMockPet,
  getMockPetsByUser,
} from "@/lib/mock-data";

/**
 * VACUNAS = privado.
 *
 * Solo el dueño de la mascota entra. Cuando esto se conecte a Supabase, este
 * notFound() se reemplaza por una policy RLS que compare pet.owner_id con
 * auth.uid(); el 404 es la sombra de mock de esa regla, no su sustituto.
 */
export function generateStaticParams() {
  return getMockPetsByUser(CURRENT_MOCK_USER_ID).map((p) => ({ id: p.id }));
}

export const metadata = {
  title: "Vacunas · prototipo Lovi",
};

export default async function ProtoPetVaccinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = getMockPet(id);
  if (!pet) notFound();
  if (pet.ownerId !== CURRENT_MOCK_USER_ID) notFound();

  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-ink/60">
          Cargando vacunas…
        </p>
      }
    >
      <ProtoPetSection petId={id} kind="vaccines" />
    </Suspense>
  );
}
