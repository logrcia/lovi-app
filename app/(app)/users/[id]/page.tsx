import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { FollowButton } from "@/components/follow-button";
import { LoviCard } from "@/components/lovi-card";
import { PetImage } from "@/components/pet-image";
import { formatLongDate } from "@/lib/format";
import {
  getFollowCounts,
  getFollowList,
  getFollowTargets,
  getProfile,
  getPublicProfile,
  getUserLovis,
  getUserPets,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const instant = false;

export const metadata: Metadata = {
  title: "Perfil · Lovi",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const TABS = [
  { key: "lovis", label: "Recuerdos" },
  { key: "siguiendo", label: "Siguiendo" },
  { key: "seguidores", label: "Seguidores" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const AVATAR_TONES = ["bg-orange", "bg-butter", "bg-navy", "bg-fucsia"];

export default async function UserPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: TabKey =
    sp.tab === "siguiendo" || sp.tab === "seguidores" ? sp.tab : "lovis";

  const supabase = await createClient();
  const viewer = await getProfile(supabase);
  const viewerId = viewer?.user_id ?? "";

  const target = await getPublicProfile(supabase, id);
  if (!target) notFound();

  const isSelf = viewerId === target.user_id;
  const [counts, following, pets, folList, lovis] = await Promise.all([
    getFollowCounts(supabase, target.user_id),
    getFollowTargets(supabase, viewerId),
    getUserPets(supabase, target.user_id),
    tab === "lovis"
      ? Promise.resolve<Awaited<ReturnType<typeof getFollowList>>>([])
      : getFollowList(
          supabase,
          target.user_id,
          tab === "siguiendo" ? "following" : "followers",
        ),
    tab === "lovis" ? getUserLovis(supabase, target.user_id) : Promise.resolve([]),
  ]);
  const isFollowing = following.has(target.user_id);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header: perfil público sin email, solo datos de la RPC pública */}
      <header className="card-lovi mb-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <PetImage
          name={target.nombre}
          src={target.image}
          className="h-28 w-28 shrink-0 rounded-full"
          imgClassName="h-full w-full rounded-full"
          tone="bg-orange"
        />
        <div className="min-w-0 flex-1">
          <p className="sticker bg-butter text-ink">perfil público</p>
          <h1 className="lovi-headline mt-3 truncate">{target.nombre}</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
            Miembro desde {formatLongDate(target.created_at)}
          </p>
          <p className="mt-2 text-sm text-ink/80">
            {counts.followers_count}{" "}
            {counts.followers_count === 1 ? "seguidor" : "seguidores"} ·{" "}
            {counts.following_count} siguiendo
          </p>
        </div>
        {isSelf ? (
          <span className="sticker self-start bg-fucsia text-cream sm:ml-auto sm:self-center">
            Este sos vos
          </span>
        ) : (
          <div className="self-start sm:ml-auto sm:self-center">
            <FollowButton targetUserId={target.user_id} isFollowing={isFollowing} />
          </div>
        )}
      </header>

      {/* Tabs */}
      <nav className="mb-8 flex flex-wrap items-center gap-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={
              t.key === "lovis"
                ? `/users/${target.user_id}`
                : `/users/${target.user_id}?tab=${t.key}`
            }
            className={cn(
              "rounded-md border-2 px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
              tab === t.key
                ? "border-ink bg-butter text-ink"
                : "border-transparent text-ink/60 hover:border-ink/40 hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Mascotas visibles (RLS: propias o de seguidos). Solo el dueño
          linkea a /pets/[id]: el resto se ve como tarjeta sin edición. */}
      <section className="mb-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {isSelf ? "Mis mascotas" : "Mascotas"}
        </p>
        {pets.length === 0 ? (
          <EmptyState tone="orange" title="Todavía no hay mascotas para mostrar." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => {
              const owned = pet.user_id === viewerId;
              const inner = (
                <>
                  <PetImage
                    name={pet.pet_name}
                    src={pet.image}
                    className="h-24 w-24 rounded-2xl"
                    imgClassName="h-full w-full rounded-2xl"
                    tone="bg-orange"
                  />
                  <span className="mt-3 block font-display text-lg font-semibold leading-tight text-ink">
                    {pet.pet_name}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-ink/50">
                    {pet.especie}
                  </span>
                </>
              );
              return (
                <div key={pet.pet_id} className="card-lovi px-5 py-4">
                  {owned ? (
                    <Link
                      href={`/pets/${pet.pet_id}`}
                      className="flex flex-col items-start transition-transform hover:-rotate-1"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex flex-col items-start">{inner}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Contenido del tab */}
      {tab === "lovis" ? (
        lovis.length === 0 ? (
          <EmptyState
            tone="fucsia"
            title={
              isSelf
                ? "Todavía no loviaste ningún recuerdo."
                : "Todavía no hay recuerdos para mostrar."
            }
            description={
              isSelf
                ? "Un paseo, una siesta, ese video inolvidable… quedan guardados para siempre."
                : undefined
            }
            cta={isSelf ? "Loviar el primero" : undefined}
            href={isSelf ? "/loviar" : undefined}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {lovis.map((lovi, i) => (
              <LoviCard
                key={lovi.lovi_id}
                lovi={lovi}
                showPet
                creator={target}
                className={
                  i % 2 === 0
                    ? "md:rotate-[0.4deg] hover:rotate-0"
                    : "md:rotate-[-0.4deg] hover:rotate-0"
                }
              />
            ))}
          </div>
        )
      ) : folList.length === 0 ? (
        <EmptyState
          tone={tab === "siguiendo" ? "butter" : "navy"}
          title={
            isSelf
              ? tab === "siguiendo"
                ? "Todavía no seguís a nadie."
                : "Todavía no tenés seguidores."
              : tab === "siguiendo"
                ? "Todavía no sigue a nadie."
                : "Todavía no tiene seguidores."
          }
          cta={isSelf && tab === "siguiendo" ? "Descubrir usuarios" : undefined}
          href={isSelf && tab === "siguiendo" ? "/users" : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {folList.map((row, i) => (
            <li
              key={row.user_id}
              className="card-lovi flex items-center gap-4 px-5 py-4"
            >
              <PetImage
                name={row.nombre}
                src={row.image}
                tone={AVATAR_TONES[i % AVATAR_TONES.length]}
                className="h-12 w-12 shrink-0 rounded-full"
                imgClassName="h-full w-full rounded-full"
              />
              <Link
                href={`/users/${row.user_id}`}
                className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-ink transition-colors hover:text-fucsia"
              >
                {row.nombre}
              </Link>
              {row.user_id === viewerId ? (
                <span className="sticker bg-cream text-ink/60">vos</span>
              ) : (
                <FollowButton
                  targetUserId={row.user_id}
                  isFollowing={row.is_following}
                  compact
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}