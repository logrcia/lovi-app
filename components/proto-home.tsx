"use client";

import { useEffect, useMemo, useState } from "react";

import { FeedCard } from "@/components/feed-card";
import { EmptyState } from "@/components/empty-state";
import { useMockFollows } from "@/lib/mock-data/follows";
import { useMockCreatedLovis } from "@/lib/mock-data/created-lovis";
import {
  getMockFeed,
  getMockRecommendedLovis,
} from "@/lib/mock-data";
import type { FeedLovi } from "@/lib/mock-data/types";

/**
 * Home del prototipo: feed vertical continuo.
 *
 * NO es TikTok, NO es una publicacion por viewport. Es una columna editorial
 * que scrollea verticalmente, con los Lovis uno debajo del otro.
 *
 * La carga progresiva se SIMULA desde el array local: se renderizan PAGE_SIZE
 * al inicio y se agregan mas al bajar, con un sentinel + IntersectionObserver.
 * Reemplaza la paginacion keyset real, que todavia no hace falta.
 */
const PAGE_SIZE = 6;

/**
 * Mezcla el feed (recuerdos de mascotas propias + seguidas) con las
 * recomendaciones (recuerdos de mascotas no seguidas):
 *
 *   - 1 recomendacion cada 3 recuerdos del feed.
 *   - El feed va primero.
 *   - Si se agotan las recomendaciones, sigue el feed; si se agota el feed,
 *     las recomendaciones sobrantes van al final.
 *
 * Ambas listas llegan ordenadas por fecha desc y el orden relativo se
 * preserva, por lo que la paginacion incremental (slice sobre `merged`) es
 * estable al cargar mas items.
 */
function interleaveFeedAndRecommendations(
  feed: FeedLovi[],
  recommended: FeedLovi[],
): FeedLovi[] {
  const merged: FeedLovi[] = [];
  let f = 0;
  let r = 0;
  while (f < feed.length || r < recommended.length) {
    for (let i = 0; i < 3 && f < feed.length; i++) {
      merged.push(feed[f++]);
    }
    if (r < recommended.length) {
      merged.push(recommended[r++]);
    }
  }
  return merged;
}

export function ProtoHome({ viewerName }: { viewerName: string }) {
  const { followedPetIds, ready } = useMockFollows();
  // Recuerdos creados en el prototipo: se pasan como PARAMETRO a getMockFeed
  // y getMockRecommendedLovis.
  const { createdLovis, ready: createdReady } = useMockCreatedLovis();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  const feed = useMemo<FeedLovi[]>(
    () => getMockFeed(followedPetIds, createdLovis),
    [followedPetIds, createdLovis],
  );

  const recommended = useMemo<FeedLovi[]>(
    () => getMockRecommendedLovis(followedPetIds, createdLovis),
    [followedPetIds, createdLovis],
  );

  // Feed + recomendaciones intercaladas 1:3.
  const merged = useMemo<FeedLovi[]>(
    () => interleaveFeedAndRecommendations(feed, recommended),
    [feed, recommended],
  );

  // Cambiar los follows o crear un recuerdo reinicia el scroll del feed:
  // si no, veríamos una lista larga con el item recien agregado fuera de
  // pantalla.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [followedPetIds, createdLovis]);

  // Antes de hidratar, ni los follows ni los recuerdos creados se leyeron.
  // Se muestra el estado inicial para no romper la hidratacion.
  const hydrated = ready && createdReady;
  const shown = hydrated ? merged.slice(0, visible) : [];
  const hasMore = hydrated && visible < merged.length;

  useEffect(() => {
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, merged.length));
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, merged.length]);

  return (
    <div>
      <header className="mb-6">
        <p className="sticker bg-orange text-ink">tu diario social</p>
        <h1 className="lovi-headline mt-3">
          Hola, <span className="italic text-fucsia">{viewerName}</span>
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Los recuerdos de tus mascotas y de las que seguís, mezclados en una
          sola línea de tiempo.
        </p>
      </header>

      {/* Antes de hidratar, los follows y recuerdos guardados todavia no se
          leyeron. Se muestra el estado inicial para no romper la
          hidratacion. */}
      {!hydrated ? (
        <p className="mb-6 border-2 border-dashed border-ink/20 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-ink/50">
          cargando tus seguidos…
        </p>
      ) : null}

      {shown.length === 0 && hydrated ? (
        <EmptyState
          tone="fucsia"
          title="Todavía no hay nada en tu feed"
          description="Seguí una mascota desde Explorar y sus recuerdos van a aparecer acá, mezclados con los tuyos."
          cta="Explorar mascotas"
          href="/proto/explore"
        />
      ) : (
        <div className="flex flex-col gap-8">
          {shown.map((lovi, i) => (
            <FeedCard
              key={lovi.id}
              lovi={lovi}
              from="/proto"
              tilt={i % 2 === 0 ? 1 : -1}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div
          ref={setSentinel}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <span className="font-display text-sm italic text-ink/50">
            bajá para seguir loviando…
          </span>
          <span className="h-1 w-24 overflow-hidden rounded-full bg-ink/10">
            <span className="block h-full w-1/2 rounded-full bg-fucsia" />
          </span>
        </div>
      ) : shown.length > 0 ? (
        <p className="mt-12 text-center font-display text-sm italic text-ink/45">
          llegaste al final · por ahora
        </p>
      ) : null}
    </div>
  );
}
