import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { LoviForm } from "@/components/lovi-form";
import { getPets } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function LoviarPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const pets = await getPets(supabase);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <p className="sticker bg-fucsia text-cream">nuevo recuerdo</p>
        <h1 className="lovi-headline mt-3">Loviar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Guardá un momento: una foto, un video, un audio, o todo junto.
          Después queda en su diario y en el calendario.
        </p>
      </header>

      {pets.length === 0 ? (
        <EmptyState
          tone="orange"
          title="Primero sumá una mascota"
          description="Sin mascotas no hay a quién loviarle. Agregá a tu compañero/a y volvé."
          cta="Agregar mi primera mascota"
          href="/pets/new"
        />
      ) : (
        <>
          <LoviForm pets={pets} initialPetId={sp.pet} />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿No era un recuerdo?{" "}
            <Link href="/" className="font-semibold text-ink underline-offset-4 hover:underline">
              Volvé al diario
            </Link>
          </p>
        </>
      )}
    </div>
  );
}