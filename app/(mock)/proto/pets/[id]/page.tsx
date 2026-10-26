import { notFound } from "next/navigation";

import { ProtoPetProfile } from "@/components/proto-pet-profile";
import { getMockPet, getMockPets } from "@/lib/mock-data";

export function generateStaticParams() {
  // Se deriva de los datos, no de una lista escrita a mano.
  return getMockPets().map((p) => ({ id: p.id }));
}

export const metadata = {
  title: "Mascota · prototipo Lovi",
};

export default async function ProtoPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getMockPet(id)) notFound();
  return <ProtoPetProfile petId={id} />;
}
