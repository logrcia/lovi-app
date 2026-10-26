"use client";

import { cn } from "@/lib/utils";
import type { MockMedia } from "@/lib/mock-data/types";

/**
 * Render multimedia de un Lovi, por caso:
 *
 *   0 medios        -> nada (Lovi textual)
 *   1 imagen       -> imagen protagonista
 *   N imagenes     -> carrusel horizontal con scroll-snap
 *   video          -> poster + elemento <video> con controles
 *   audio          -> bloque visual de audio con <audio> real
 *   mixto          -> carrusel, con el audio al final
 *
 * NO es full-screen por viewport: es un feed editorial continuo, asi que
 * las imagenes usan aspect-ratio y el carrusel scrollea en horizontal.
 */
export function MediaGallery({
  media,
  alt,
  className,
}: {
  media: MockMedia[];
  alt: string;
  className?: string;
}) {
  if (media.length === 0) return null;

  // Una sola imagen: protagonista, sin carrusel.
  if (media.length === 1) {
    return (
      <div className={cn("border-b-2 border-ink bg-ink", className)}>
        <SingleMedia media={media[0]} alt={alt} />
      </div>
    );
  }

  return (
    <div className={cn("border-b-2 border-ink bg-ink", className)}>
      <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto">
        {media.map((m, i) => (
          <div
            key={m.id}
            className="w-full shrink-0 snap-center"
            aria-label={m.alt ?? `${alt} ${i + 1}`}
          >
            <SingleMedia media={m} alt={m.alt ?? `${alt} ${i + 1}`} />
          </div>
        ))}
      </div>
      {/* Indicador de carrusel: solo si hay mas de una imagen visible. */}
      {media.filter((m) => m.type !== "audio").length > 1 ? (
        <p className="bg-ink px-4 py-1.5 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-cream/70">
          ↔ {media.length} en el recuerdo
        </p>
      ) : null}
    </div>
  );
}

function SingleMedia({ media, alt }: { media: MockMedia; alt: string }) {
  if (media.type === "audio") {
    return (
      <div className="flex flex-col gap-3 bg-butter p-5">
        <div className="flex items-center gap-2">
          <span className="sticker bg-fucsia text-cream">Audio</span>
          <span className="font-display text-sm italic text-ink/70">
            {alt}
          </span>
        </div>
        <audio
          src={media.url}
          controls
          preload="metadata"
          className="w-full"
        />
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <div className="relative">
        <video
          src={media.url}
          poster={media.posterUrl}
          controls
          preload="metadata"
          playsInline
          className="aspect-[4/3] w-full"
          style={{ objectFit: "cover" }}
        />
        <span className="sticker absolute left-3 top-3 bg-navy text-cream">
          Video
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={media.url}
      alt={alt}
      loading="lazy"
      className="aspect-[4/3] w-full"
      style={{ objectFit: "cover" }}
    />
  );
}
