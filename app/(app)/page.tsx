import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { LoviCard } from "@/components/lovi-card";
import {
  getFollowTargets,
  getLovisFeed,
  getPets,
  getProfile,
  getPublicProfiles,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

// Feed dependiente de la sesión del usuario: render dinámico (no instant).
export const instant = false;

export default async function FeedPage() {
  const supabase = await createClient();
  const profile = await getProfile(supabase);
  const viewerId = profile?.user_id ?? "";
  const [pets, lovis, followingTargets] = await Promise.all([
    getPets(supabase),
    getLovisFeed(supabase),
    getFollowTargets(supabase, viewerId).catch(() => new Set<string>()),
  ]);

  // Atribución de autor: los lovis del feed pueden venir de usuarios
  // seguidos (RLS 0004), así que se enriquecen con su perfil público.
  const creatorIds = [...new Set(lovis.map((l) => l.creator_user_id))];
  const creators = await getPublicProfiles(supabase, creatorIds);
  const creatorByUser = new Map(creators.map((c) => [c.user_id, c] as const));

  const firstName = profile?.nombre.trim().split(/\s+/)[0] ?? "hola";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="sticker bg-orange text-ink">tu diario privado</p>
        <h1 className="lovi-headline mt-3">
          Hola, <span className="italic text-fucsia">{firstName}</span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Los recuerdos de tus mascotas, en un solo lugar. Quizás hoy sea buen
          día para <span className="font-semibold text-ink">loviar</span> algo.
        </p>
      </header>

      {pets.length === 0 ? (
        <EmptyState
          tone="orange"
          title="Todavía no agregaste ninguna mascota."
          description="Para empezar a guardar recuerdos, primero contanos quién forma parte de tu vida."
          cta="Agregar mi primera mascota"
          href="/pets/new"
        />
      ) : lovis.length === 0 ? (
        followingTargets.size === 0 ? (
          <EmptyState
            tone="fucsia"
            title="Todavía no seguís a nadie"
            description="Seguí a otros amantes de mascotas para llenar tu diario con sus momentos."
            cta="Descubrir usuarios"
            href="/users"
          />
        ) : (
          <EmptyState
            tone="fucsia"
            title="Todavía no hay recuerdos"
            description="Los momentos de tus mascotas y de quienes seguís van a aparecer acá."
            cta="Loviar algo"
            href="/loviar"
          />
        )
      ) : (
        <>
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {lovis.length} {lovis.length === 1 ? "recuerdo" : "recuerdos"}
          </p>
          <div className="flex flex-col gap-8">
            {lovis.map((lovi, i) => (
              <LoviCard
                key={lovi.lovi_id}
                lovi={lovi}
                canDelete={lovi.creator_user_id === viewerId}
                creator={creatorByUser.get(lovi.creator_user_id)}
                className={
                  i % 2 === 0
                    ? "md:rotate-[0.4deg] hover:rotate-0"
                    : "md:rotate-[-0.4deg] hover:rotate-0"
                }
              />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/loviar"
              className="btn-ghost-ink"
            >
              + Loviar otro recuerdo
            </Link>
          </div>
        </>
      )}
    </div>
  );
}