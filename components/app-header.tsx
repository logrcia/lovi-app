"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { LoviWordmark } from "@/components/lovi-wordmark";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/pets", label: "Mis mascotas" },
  { href: "/users", label: "Usuarios" },
  { href: "/calendar", label: "Calendario" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function AppHeader({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <LoviWordmark href="/" />

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 lg:order-2 lg:w-auto lg:pb-0">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md border-2 border-transparent px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
                isActive(item.href)
                  ? "border-ink bg-butter text-ink"
                  : "text-ink/70 hover:border-ink/40 hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-3 lg:order-3 lg:ml-0">
          <Link
            href="/loviar"
            className="btn-loviar text-xs"
            aria-label="Crear un Lovi"
          >
            Loviar
          </Link>

          {profile && (
            <Link
              href="/profile"
              aria-label="Mi perfil"
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-orange font-sans text-sm font-black text-ink transition-transform hover:-rotate-6"
            >
              {initials(profile.nombre)}
            </Link>
          )}

          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-parchment text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}