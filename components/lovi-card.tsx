import Link from "next/link";

import { DeleteLoviButton } from "@/components/delete-lovi-button";
import { MediaItem } from "@/components/media-item";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LoviWithMedia } from "@/lib/types";

/** Atribución de autor de un Lovi en el feed social (capa 0004). */
export type LoviCreator = {
  user_id: string;
  nombre: string;
  image?: string | null; // URL firmada del avatar
};

export function LoviCard({
  lovi,
  showPet = true,
  canDelete = false,
  creator,
  className,
}: {
  lovi: LoviWithMedia;
  showPet?: boolean;
  canDelete?: boolean;
  creator?: LoviCreator;
  className?: string;
}) {
  const media = lovi.media.map((m, i) => ({
    ...m,
    signedUrl: lovi.media_signed_urls[i] ?? null,
  }));
  const hasMedia = media.length > 0;

  return (
    <article className={cn("card-lovi overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-ink px-5 py-3">
        {showPet ? (
          <Link
            href={`/pets/${lovi.pet_id}`}
            className="sticker bg-butter text-ink hover:bg-butter/80"
          >
            {lovi.pet_name}
          </Link>
        ) : (
          <span className="sticker bg-navy text-cream">Recuerdo</span>
        )}
        <time
          dateTime={lovi.created_at}
          className="ml-auto font-display text-sm italic text-ink/70"
        >
          {formatLongDate(lovi.created_at)}
        </time>
        {canDelete ? <DeleteLoviButton loviId={lovi.lovi_id} /> : null}
      </div>

      {creator ? (
        <div className="flex justify-end border-b-2 border-ink/10 bg-cream/50 px-5 py-2">
          <Link
            href={`/users/${creator.user_id}`}
            className="group -mr-1 inline-flex max-w-full items-center gap-2 rounded-full border-2 border-ink/20 bg-parchment py-0.5 pl-0.5 pr-2.5 transition-colors hover:border-ink hover:bg-butter"
          >
            {creator.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.image}
                alt={creator.nombre}
                className="h-6 w-6 shrink-0 rounded-full border-2 border-ink object-cover"
              />
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-orange text-[10px] font-black text-ink">
                {(creator.nombre.trim()[0] ?? "?").toUpperCase()}
              </span>
            )}
            <span className="truncate text-[11px] font-bold uppercase tracking-wide text-ink/70 group-hover:text-ink">
              {creator.nombre}
            </span>
          </Link>
        </div>
      ) : null}

      {hasMedia ? (
        <div className="border-b-2 border-ink">
          <div
            className={cn(
              "grid gap-1 bg-ink p-1",
              media.length > 1 && "grid-cols-2",
            )}
          >
            {media[0].media_type === "image" || media[0].media_type === "video" ? (
              <MediaItem
                type={media[0].media_type}
                src={media[0].signedUrl}
                alt={lovi.title}
                className={cn(
                  "aspect-[4/3]",
                  media.length > 1 && "col-span-2",
                )}
              />
            ) : (
              <div className={cn("flex items-center justify-center bg-cream p-6", media.length > 1 && "col-span-2")}>
                <MediaItem type="audio" src={media[0].signedUrl} />
              </div>
            )}
            {media.slice(1).map((m, i) =>
              m.media_type === "audio" ? (
                <div key={m.media_id} className="flex items-center justify-center bg-cream p-4">
                  <MediaItem type="audio" src={m.signedUrl} />
                </div>
              ) : (
                <MediaItem
                  key={m.media_id}
                  type={m.media_type}
                  src={m.signedUrl}
                  alt={`${lovi.title} ${i + 2}`}
                  className="aspect-square"
                />
              ),
            )}
          </div>
        </div>
      ) : null}

      <div className="px-5 py-4">
        <h3 className="font-display text-2xl font-semibold leading-tight text-ink">
          {lovi.title}
        </h3>
        {lovi.description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {lovi.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}