"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PetCard } from "@/components/pet-card";
import { TextInput } from "@/components/form";
import { useMockFollows } from "@/lib/mock-data/follows";
import { getMockDiscoverablePets } from "@/lib/mock-data";

/**
 * Explorar: mascotas ajenas que el viewer todavia NO sigue.
 *
 * Listado ordenado por seguidores para que se vea de entrada cuales tienen
 * comunidad. Incluye un buscador por nombre de mascota: el filtro se hace en
 * memoria (case-insensitive, coincidencia parcial) sobre el array ya devuelto
 * por getMockDiscoverablePets, sin tocar Supabase ni queries reales.
 */
export function ProtoExplore() {
  const { followedPetIds, ready } = useMockFollows();
  const [query, setQuery] = useState("");

  const discoverable = useMemo(
    () => getMockDiscoverablePets(followedPetIds),
    [followedPetIds],
  );
  const notFollowed = discoverable.filter((p) => !p.isFollowing);

  const normalized = query.toLowerCase().trim();
  const hasQuery = normalized !== "";
  const results = notFollowed.filter((pet) =>
    pet.name.toLowerCase().includes(normalized),
  );

  const clearQuery = () => setQuery("");

  return (
    <div>
      <header className="mb-8">
        <p className="sticker bg-fucsia text-cream">descubrir</p>
        <h1 className="lovi-headline mt-3">Explorar mascotas</h1>
        <p className="mt-2 text-sm text-ink/70">
          Cada mascota es una entidad con sus propios seguidores. Seguí solo
          las que te interesen: las demás no aparecen en tu Home.
        </p>
      </header>

      {/* Buscador por nombre de mascota (prototipo: filtro en memoria). */}
      <div className="mb-8 flex max-w-md flex-col gap-2">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50"
          />
          <TextInput
            id="proto_explore_search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar mascota por nombre…"
            aria-label="Buscar mascota por nombre"
          />
        </div>
        {hasQuery && results.length > 0 && (
          <button type="button" onClick={clearQuery} className="btn-ghost-ink text-xs">
            Limpiar búsqueda
          </button>
        )}
      </div>

      {hasQuery && results.length === 0 ? (
        <div className="card-lovi px-5 py-10 text-center">
          <p className="font-display text-xl text-ink">
            No se encontró ninguna mascota con ese nombre
          </p>
          <p className="mt-2 text-sm text-ink/60">
            Probá con otro nombre o revisá cómo escribiste.
          </p>
          <button
            type="button"
            onClick={clearQuery}
            className="mt-4 btn-loviar"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : notFollowed.length === 0 ? (
        <div className="card-lovi px-5 py-10 text-center">
          <p className="font-display text-xl text-ink">
            Ya seguís a todas las mascotas
          </p>
          <p className="mt-2 text-sm text-ink/60">
            Tu Home tiene todo el contenido disponible del prototipo.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-ink/50">
            {results.length} para descubrir
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {results.map((pet, i) => (
              <PetCard
                key={pet.id}
                pet={pet}
                from="/proto/explore"
                tilt={i % 2 === 0 ? 1 : -1}
              />
            ))}
          </div>
        </>
      )}

      {ready && notFollowed.length > 0 && followedPetIds.length > 0 ? (
        <p className="mt-10 text-center font-display text-sm italic text-ink/45">
          las que ya seguís salen de acá y aparecen en tu Home
        </p>
      ) : null}
    </div>
  );
}
