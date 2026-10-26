"use client";

import Link from "next/link";
import { AudioLines, ImageIcon, PenLine, PlayCircle } from "lucide-react";

import { MediaGallery } from "@/components/media-gallery";
import { withFrom } from "@/components/proto-back-link";
import { formatLongDate } from "@/lib/format";
import { useMockFollows } from "@/lib/mock-data/follows";
import { cn } from "@/lib/utils";
import { CURRENT_MOCK_USER_ID } from "@/lib/mock-data";
import type { FeedLovi } from "@/lib/mock-data/types";

/**
 * Publicacion del feed social.
 *
 * Muestra: mascota, dueño, avatar de mascota, fecha, título, descripción y
 * multimedia. Elliaje alterna leve, como el resto de Lovi.
 *
 * Es un componente de presentacion: recibe un FeedLovi ya hidratado y no
 * sabe de donde viene el dato. El unico estado que consume es el follows
 * del provider, para el boton de la mascota.
 *
 * `from` es la pantalla donde se muestra la publicacion. Viaja en ?from= para
 * que el back del perfil de mascota o de la persona vuelva aca.
 */
export function FeedCard({
  lovi,
  tilt = 0,
  className,
  from,
}: {
  lovi: FeedLovi;
  tilt?: number;
  className?: string;
  from?: string;
}) {
  const { toggleFollow, followedPetIds } = useMockFollows();
  const isFollowing = followedPetIds.includes(lovi.pet.id);
  // La etiqueta "Tu mascota" se decide con el owner_id de la mascota, no con
  // un prop: ninguna mascota del viewer puede mostrar Seguir por error.

  return (
    <article
      className={cn(
        "card-lovi overflow-hidden",
        tilt === 1 && "md:rotate-[0.35deg] hover:rotate-0",
        tilt === -1 && "md:rotate-[-0.35deg] hover:rotate-0",
        className,
      )}
    >
      {/* Header: mascota a la izquierda, dueño a la derecha */}
      <header className="flex items-center gap-3 border-b-2 border-ink bg-parchment px-4 py-3">
        <Link
          href={
            from
              ? withFrom(`/proto/pets/${lovi.pet.id}`, from)
              : `/proto/pets/${lovi.pet.id}`
          }
          className="group flex min-w-0 items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lovi.pet.image}
            alt={lovi.pet.name}
            className="h-11 w-11 shrink-0 rounded-full border-2 border-ink object-cover"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-semibold leading-tight text-ink group-hover:underline">
              {lovi.pet.name}
            </span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-[0.14em] text-ink/55">
              {lovi.pet.especie} · {lovi.followerCount} seg.
            </span>
          </span>
        </Link>
        {lovi.isRecommendation && (
          <span className="sticker bg-fucsia text-cream">
            De cuentas que no seguís
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <time
            dateTime={lovi.createdAt}
            className="hidden font-display text-xs italic text-ink/60 sm:block"
          >
            {formatLongDate(lovi.createdAt)}
          </time>
          {lovi.pet.ownerId === CURRENT_MOCK_USER_ID ? (
            <span className="sticker bg-butter text-ink">Tu mascota</span>
          ) : (
            <button
              type="button"
              onClick={() => toggleFollow(lovi.pet.id)}
              aria-pressed={isFollowing}
              className={cn(
                "border-2 border-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                isFollowing
                  ? "bg-cream text-ink hover:bg-butter"
                  : "bg-fucsia text-cream hover:bg-orange hover:text-ink",
              )}
            >
              {isFollowing ? "Siguiendo" : "Seguir"}
            </button>
          )}
        </div>
      </header>

      {/* Dueno, alineado a la derecha como el collage de Lovi */}
      <div className="flex items-center justify-end gap-2 border-b-2 border-ink/10 bg-cream/60 px-4 py-1.5">
        <Link
          href={
            from
              ? withFrom(`/proto/users/${lovi.owner.id}`, from)
              : `/proto/users/${lovi.owner.id}`
          }
          className="group -mr-1 inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 bg-parchment py-0.5 pl-0.5 pr-2 transition-colors hover:border-ink hover:bg-butter"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lovi.owner.avatar}
            alt={lovi.owner.nombre}
            className="h-5 w-5 rounded-full border-2 border-ink object-cover"
          />
          <span className="truncate text-[10px] font-bold uppercase tracking-wide text-ink/70 group-hover:text-ink">
            {lovi.owner.nombre}
          </span>
        </Link>
        <time
          dateTime={lovi.createdAt}
          className="font-display text-[10px] italic text-ink/50 sm:hidden"
        >
          {formatLongDate(lovi.createdAt)}
        </time>
      </div>

      <MediaGallery media={lovi.media} alt={lovi.title} />

      {/* Cuerpo: titulo + descripcion. En un Lovi textual, esto es todo. */}
      <div className="px-5 py-4">
        {lovi.media.length === 0 ? (
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
            <PenLine size={12} strokeWidth={2.5} />
            solo palabras
          </p>
        ) : null}
        <h3 className="font-display text-2xl font-semibold leading-tight text-ink">
          {lovi.title}
        </h3>
        {lovi.description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {lovi.description}
          </p>
        ) : null}

        {lovi.media.length > 0 ? (
          <p className="mt-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">
            {lovi.media.some((m) => m.type === "image") ? (
              <span className="flex items-center gap-1">
                <ImageIcon size={12} strokeWidth={2.5} />
                {lovi.media.filter((m) => m.type === "image").length} foto
                {lovi.media.filter((m) => m.type === "image").length > 1 ? "s" : ""}
              </span>
            ) : null}
            {lovi.media.some((m) => m.type === "video") ? (
              <span className="flex items-center gap-1">
                <PlayCircle size={12} strokeWidth={2.5} />
                video
              </span>
            ) : null}
            {lovi.media.some((m) => m.type === "audio") ? (
              <span className="flex items-center gap-1">
                <AudioLines size={12} strokeWidth={2.5} />
                audio
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </article>
  );
}
