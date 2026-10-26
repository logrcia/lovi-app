import Link from "next/link";
import { CalendarDays, Compass, Home, PawPrint, Search } from "lucide-react";

import { MockFollowProvider } from "@/lib/mock-data/follows";
import { MockCreatedLovisProvider } from "@/lib/mock-data/created-lovis";
import { getMockUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Layout del prototipo. Vive en el route group (mock) FUERA de (app), asi
 * que no pasa por el auth gate de app/(app)/layout.tsx y no importa nada
 * de Supabase.
 *
 * El unico ajuste global relacionado esta en lib/supabase/proxy.ts, que
 * excluye /proto del redirect a login. Las rutas reales siguen igual.
 */

const NAV = [
  { href: "/proto", label: "Home", Icon: Home },
  { href: "/proto/explore", label: "Explorar", Icon: Compass },
  { href: "/proto/calendar", label: "Calendario", Icon: CalendarDays },
] as const;

export default function MockLayout({ children }: { children: React.ReactNode }) {
  const viewer = getMockUser("user-abril");

  return (
    <MockFollowProvider>
      <MockCreatedLovisProvider>
        <div className="flex min-h-dvh flex-col bg-cream">
          <header className="sticky top-0 z-20 border-b-2 border-ink bg-parchment">
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
              <Link href="/proto" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-fucsia text-cream shadow-sticker-sm">
                  <PawPrint size={16} strokeWidth={2.5} />
                </span>
                <span className="font-display text-lg font-semibold italic text-ink">
                  lovi
                </span>
              </Link>

              <span className="sticker hidden bg-butter text-ink sm:inline-flex">
                prototipo
              </span>

              <nav className="ml-auto flex items-center gap-1">
                {NAV.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex items-center gap-1.5 border-2 border-ink px-2.5 py-1",
                      "text-[10px] font-bold uppercase tracking-widest transition-colors",
                      "hover:bg-butter",
                    )}
                  >
                    <Icon size={13} strokeWidth={2.5} />
                    {label}
                  </Link>
                ))}
              </nav>

              {viewer ? (
                <Link
                  href={`/proto/users/${viewer.id}`}
                  className="shrink-0"
                  title={`Perfil de ${viewer.nombre}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewer.avatar}
                    alt={viewer.nombre}
                    className="h-8 w-8 rounded-full border-2 border-ink object-cover"
                  />
                </Link>
              ) : null}
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
            {children}
          </main>

          <footer className="mt-auto border-t-2 border-ink bg-parchment">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-6 text-center">
              <p className="flex items-center gap-1.5 font-display text-sm italic text-ink/60">
                <Search size={13} strokeWidth={2.5} />
                Prototipo con datos mock · sin conexión a Supabase
              </p>
              <Link
                href="/"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40 underline underline-offset-4 hover:text-ink"
              >
                volver a la app real
              </Link>
            </div>
          </footer>
        </div>
      </MockCreatedLovisProvider>
    </MockFollowProvider>
  );
}
