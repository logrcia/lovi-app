import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { FollowButton } from "@/components/follow-button";
import { PetImage } from "@/components/pet-image";
import {
  getFollowTargets,
  getProfile,
  searchPublicUsers,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Usuarios · Lovi",
};

type Props = { searchParams: Promise<{ q?: string }> };

const AVATAR_TONES = ["bg-orange", "bg-butter", "bg-navy", "bg-fucsia"];

export default async function UsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const supabase = await createClient();
  const profile = await getProfile(supabase);
  const viewerId = profile?.user_id ?? "";

  const [users, following] = await Promise.all([
    searchPublicUsers(supabase, q),
    getFollowTargets(supabase, viewerId),
  ]);
  // El viewer nunca aparece en su propia búsqueda.
  const visible = users.filter((u) => u.user_id !== viewerId);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="sticker bg-navy text-cream">comunidad</p>
        <h1 className="lovi-headline mt-3">Usuarios</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Descubrí otras personas que lovian a sus mascotas y seguí sus
          momentos.
        </p>
      </header>

      <form method="get" action="/users" className="mb-8 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar personas..."
          aria-label="Buscar personas"
          className="h-11 min-w-0 flex-1 border-2 border-ink bg-parchment px-4 text-sm text-ink placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fucsia"
        />
        <button type="submit" className="btn-ink !px-4 !py-0">
          <Search size={16} strokeWidth={2.5} />
          Buscar
        </button>
      </form>

      {visible.length === 0 ? (
        <EmptyState
          tone="navy"
          title="Todavía no hay personas para mostrar."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((u, i) => (
            <li
              key={u.user_id}
              className="card-lovi flex items-center gap-4 px-5 py-4"
            >
              <PetImage
                name={u.nombre}
                src={u.image}
                tone={AVATAR_TONES[i % AVATAR_TONES.length]}
                className="h-12 w-12 shrink-0 rounded-full"
                imgClassName="h-full w-full rounded-full"
              />
              <Link
                href={`/users/${u.user_id}`}
                className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-ink transition-colors hover:text-fucsia"
              >
                {u.nombre}
              </Link>
              <FollowButton
                targetUserId={u.user_id}
                isFollowing={following.has(u.user_id)}
                compact
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}