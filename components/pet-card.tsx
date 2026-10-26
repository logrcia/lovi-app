"use client";

import Link from "next/link";

import { PetFollowButton } from "@/components/pet-follow-button";
import { withFrom } from "@/components/proto-back-link";
import { useMockFollows } from "@/lib/mock-data/follows";
import { cn } from "@/lib/utils";
import type { PetWithSocial } from "@/lib/mock-data/types";

/**
 * Card de mascota: la entidad social protagonista.
 *
 * Se usa en el perfil humano (grid de "Sus mascotas") y en Explorar.
 * Muestra foto, nombre, especie, seguidores y acceso al perfil.
 * El boton de seguimiento lee su estado del provider, asi que no hace
 * falta pasarle nada desde arriba.
 *
 * `from` es la pantalla donde esta card vive. Viaja en ?from= para que el
 * back del perfil de la mascota vuelva aca y no a un destino fijo. Sin el
 * prop el back usa su fallback, asi que es opcional.
 */
export function PetCard({
  pet,
  className,
  tilt = 0,
  from,
}: {
  pet: PetWithSocial;
  className?: string;
  tilt?: number;
  from?: string;
}) {
  const { followedPetIds } = useMockFollows();
  const isFollowing = followedPetIds.includes(pet.id);
  const petHref = from
    ? withFrom(`/proto/pets/${pet.id}`, from)
    : `/proto/pets/${pet.id}`;

  return (
    <article
      className={cn(
        "card-lovi flex flex-col overflow-hidden",
        tilt === 1 && "md:rotate-[0.4deg] hover:rotate-0",
        tilt === -1 && "md:rotate-[-0.4deg] hover:rotate-0",
        className,
      )}
    >
      <Link
        href={petHref}
        className="group block border-b-2 border-ink"
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pet.image}
            alt={pet.name}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {isFollowing ? (
            <span className="sticker absolute left-2.5 top-2.5 bg-fucsia text-cream">
              Siguiendo
            </span>
          ) : null}
          {pet.isOwnPet ? (
            <span className="sticker absolute left-2.5 top-2.5 bg-butter text-ink">
              Tu mascota
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-semibold leading-tight text-ink">
            <Link href={petHref} className="hover:underline">
              {pet.name}
            </Link>
          </h3>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/50">
            {pet.especie}
          </span>
        </div>

        <p className="mt-1 text-xs font-bold text-ink/70">
          {pet.followerCount}{" "}
          {pet.followerCount === 1 ? "seguidor" : "seguidores"}
        </p>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/70">
          {pet.description}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t-2 border-dashed border-ink/15 pt-3">
          <Link
            href={
              from
                ? withFrom(`/proto/users/${pet.owner.id}`, from)
                : `/proto/users/${pet.owner.id}`
            }
            className="group/owner flex min-w-0 items-center gap-1.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pet.owner.avatar}
              alt={pet.owner.nombre}
              className="h-5 w-5 shrink-0 rounded-full border-2 border-ink object-cover"
            />
            <span className="truncate text-[10px] font-bold uppercase tracking-wide text-ink/60 group-hover/owner:text-ink">
              {pet.owner.nombre}
            </span>
          </Link>
          <PetFollowButton
            petId={pet.id}
            isOwnPet={pet.isOwnPet}
            isFollowing={isFollowing}
            showLabelWhenOwn={false}
          />
        </div>
      </div>
    </article>
  );
}
