import { notFound } from "next/navigation";

import { ProtoUserProfile } from "@/components/proto-user-profile";
import { getMockUser, getMockUsers } from "@/lib/mock-data";

export function generateStaticParams() {
  return getMockUsers().map((u) => ({ id: u.id }));
}

export const metadata = {
  title: "Persona · prototipo Lovi",
};

export default async function ProtoUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getMockUser(id)) notFound();
  return <ProtoUserProfile userId={id} />;
}
