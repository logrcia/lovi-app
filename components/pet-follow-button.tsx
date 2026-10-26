"use client";

import { Heart, PawPrint } from "lucide-react";

import { useMockFollows } from "@/lib/mock-data/follows";
import { cn } from "@/lib/utils";

/**
 * Boton Seguir / Siguiendo de una MASCOTA.
 *
 * Nunca aparece en una mascota propia: en ese caso el perfil muestra
 * "Tu mascota" en su lugar. La regla se aplica con `isOwnPet`, que sale
 * del provider (no de un prop), para que ningun llamador pueda
 * renderizar un boton sobre una mascota del viewer.
 *
 * when isOwnPet: renderiza la etiqueta sutil y no el boton.
 */
export function PetFollowButton({
  petId,
  isOwnPet,
  isFollowing,
  className,
  showLabelWhenOwn = true,
}: {
  petId: string;
  isOwnPet: boolean;
  isFollowing: boolean;
  className?: string;
  showLabelWhenOwn?: boolean;
}) {
  const { toggleFollow, isFollowing: followState } = useMockFollows();
  // El estado vive en el provider; el prop es solo el valor inicial para
  // evitar el destello antes de hidratar.
  const following = followState(petId) || isFollowing;

  if (isOwnPet) {
    if (!showLabelWhenOwn) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 border-2 border-dashed border-ink/40 px-3 py-1.5",
          "text-xs font-bold uppercase tracking-wider text-ink/60",
          className,
        )}
      >
        <PawPrint size={14} strokeWidth={2.5} className="text-fucsia" />
        Tu mascota
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleFollow(petId)}
      aria-pressed={following}
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-ink px-4 py-1.5",
        "text-xs font-bold uppercase tracking-widest transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        following
          ? "bg-cream text-ink shadow-sticker-sm hover:bg-butter"
          : "bg-fucsia text-cream shadow-sticker-sm hover:-rotate-2 hover:bg-orange hover:text-ink",
        className,
      )}
    >
      <Heart
        size={14}
        strokeWidth={2.5}
        className={following ? "fill-fucsia text-fucsia" : "text-cream"}
      />
      {following ? "Siguiendo" : "Seguir"}
    </button>
  );
}
