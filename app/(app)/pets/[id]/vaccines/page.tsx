import { redirect } from "next/navigation";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default async function PetVaccinesRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/pets/${id}/medical?tab=vaccines`);
}