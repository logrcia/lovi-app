"use client";

import { PetCard } from "@/components/pet-card";
import { ProtoBackLink } from "@/components/proto-back-link";
import { useMockFollows } from "@/lib/mock-data/follows";
import { getMockUserFollowerTotal, getMockPetsWithSocial } from "@/lib/mock-data";

/**
 * Perfil humano del prototipo. NO tiene boton Seguir: el usuario humano no
 * es la entidad que se sigue, es una puerta de entrada a sus mascotas.
 *
 * Muestra avatar, nombre, bio, cantidad de mascotas y el grid de "Sus
 * mascotas", cada una con su propio contador y acceso a su perfil.
 */
export function ProtoUserProfile({ userId }: { userId: string }) {
  const { followedPetIds, viewerId } = useMockFollows();
  const user = getMockPetsWithSocial(followedPetIds).find(
    (p) => p.owner.id === userId,
  )?.owner;

  if (!user) return null;

  const pets = getMockPetsWithSocial(followedPetIds).filter(
    (p) => p.owner.id === userId,
  );
  const totalFollowers = getMockUserFollowerTotal(userId, followedPetIds);
  const isSelf = userId === viewerId;

  return (
    <div>
      {/* Vuelve a la pantalla de la que se entro. Fallback: Explorar, que es
          de donde se llega a un perfil humano desde el prototipo. */}
      <ProtoBackLink label="volver" fallback="/proto/explore" />

      <header className="card-lovi mb-8 flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:items-center sm:gap-7 sm:text-left">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar}
            alt={user.nombre}
            className="h-28 w-28 rotate-[-1.5deg] rounded-full border-2 border-ink object-cover shadow-sticker-sm"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="sticker bg-butter text-ink">persona</span>
            {isSelf ? (
              <span className="sticker bg-orange text-ink">Este sos vos</span>
            ) : null}
          </div>

          <h1 className="lovi-headline mt-2 !text-4xl">{user.nombre}</h1>

          <p className="mt-2 text-sm text-ink/75">{user.bio}</p>

          {/* Conteos agregados de sus mascotas. No hay "seguir usuario". */}
          <p className="mt-3 text-sm font-bold text-ink/70">
            {pets.length}{" "}
            {pets.length === 1 ? "mascota" : "mascotas"} · {totalFollowers}{" "}
            {totalFollowers === 1 ? "seguidor" : "seguidores"} en total
          </p>
        </div>
      </header>

      <h2 className="mb-5 font-display text-2xl font-semibold text-ink">
        Sus mascotas
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
{pets.map((pet, i) => (
            <PetCard
              key={pet.id}
              pet={pet}
              from={`/proto/users/${userId}`}
              tilt={i % 2 === 0 ? 1 : -1}
            />
          ))}
      </div>
    </div>
  );
}
