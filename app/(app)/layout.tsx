import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

// Todo el grupo autenticado depende de cookies de sesión: la ruta bloquea
// en render (cacheComponents) en lugar de fallar al prerenderizar.
export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getProfile(supabase);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
      <footer className="mt-auto border-t-2 border-ink bg-parchment">
        <p className="mx-auto max-w-6xl px-4 py-6 text-center font-display text-sm italic text-muted-foreground">
          Lovi · del verbo <span className="font-semibold not-italic text-ink">loviar</span> —
          guardar un recuerdo con cariño.
        </p>
      </footer>
    </div>
  );
}