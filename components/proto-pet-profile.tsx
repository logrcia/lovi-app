"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarHeart,
  Camera,
  FolderHeart,
  Plus,
  Stethoscope,
} from "lucide-react";

import { FeedCard } from "@/components/feed-card";
import { ProtoBackLink, withFrom } from "@/components/proto-back-link";
import { PetFollowButton } from "@/components/pet-follow-button";
import { ProtoLoviForm } from "@/components/proto-lovi-form";
import { useMockFollows } from "@/lib/mock-data/follows";
import { useMockCreatedLovis } from "@/lib/mock-data/created-lovis";
import {
  CURRENT_MOCK_USER_ID,
  getMockPet,
  getMockPetLovis,
  getMockPetWithSocial,
  getMockUser,
} from "@/lib/mock-data";
import {
  getMockAlbums,
  getMockAppointments,
  getMockVaccines,
} from "@/lib/mock-data/pet-sections";
import { cn } from "@/lib/utils";

/**
 * Perfil de mascota del prototipo: la entidad social protagonista.
 *
 * Muestra foto, nombre, especie, edad, descripción, dueño (con link),
 * seguidores, Seguir/Siguiendo (o "Tu mascota") y los recuerdos.
 *
 * Las cinco secciones son navegables. Recuerdos, Álbumes, Vacunas y Turnos
 * son rutas por mascota; Calendario es global, como en la app real.
 */
const SECTIONS = [
  { key: "lovis", label: "Recuerdos", Icon: Camera, tone: "bg-orange" },
  { key: "albums", label: "Álbumes", Icon: FolderHeart, tone: "bg-butter" },
  { key: "vaccines", label: "Vacunas", Icon: Stethoscope, tone: "bg-butter" },
  {
    key: "appointments",
    label: "Turnos",
    Icon: CalendarHeart,
    tone: "bg-fucsia",
  },
] as const;

export function ProtoPetProfile({ petId }: { petId: string }) {
  const { followedPetIds, ready } = useMockFollows();
  // Recuerdos creados en el prototipo: se pasan como PARÁMETRO a index.ts.
  const { createdLovis, ready: createdReady } = useMockCreatedLovis();
  const [showForm, setShowForm] = useState(false);

  const pet = getMockPet(petId);
  if (!pet) return null;

  const social = getMockPetWithSocial(petId, followedPetIds);
  if (!social) return null;

  const owner = getMockUser(pet.ownerId);
  const lovis =
    ready && createdReady ? getMockPetLovis(petId, followedPetIds, createdLovis) : [];
  const age = pet.ageLabel;

  const isOwner = pet.ownerId === CURRENT_MOCK_USER_ID;
  const counts = {
    lovis: lovis.length,
    albums: getMockAlbums(petId).length,
    vaccines: getMockVaccines(petId).length,
    appointments: getMockAppointments(petId).length,
  };

  // Vacunas y Turnos son privados: solo se ofrecen en mascotas propias.
  // Albumes y Calendario se mantienen publicos / privados respectivamente.
  const visibleSections = SECTIONS.filter(
    (s) =>
      isOwner ||
      (s.key !== "vaccines" && s.key !== "appointments"),
  );

  return (
    <div>
      {/* Vuelve a la pantalla de la que se entro, no a una fija: desde
          Explorar vuelve a Explorar, desde el feed vuelve al feed. Antes
          estaba cableado a "tu perfil" y eso costaba un salto extra. */}
      <ProtoBackLink label="volver" fallback="/proto/explore" />

      {/* Header compacto: foto contenida, info al lado, sin scroll largo */}
      <header className="card-lovi mb-8 overflow-hidden">
        <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-start sm:gap-7 sm:p-7">
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pet.image}
              alt={pet.name}
              className="h-36 w-36 rotate-[-1.5deg] rounded-2xl border-2 border-ink object-cover shadow-sticker-sm sm:h-44 sm:w-44"
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="sticker bg-butter text-ink">{pet.especie}</span>
              {social.isOwnPet ? (
                <span className="sticker bg-orange text-ink">Tu mascota</span>
              ) : null}
            </div>

            <h1 className="lovi-headline mt-2 !text-4xl">{pet.name}</h1>

            <p className="mt-1 text-sm font-bold text-ink/70">
              {age} · {social.followerCount}{" "}
              {social.followerCount === 1 ? "seguidor" : "seguidores"}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {pet.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <PetFollowButton
                petId={pet.id}
                isOwnPet={social.isOwnPet}
                isFollowing={social.isFollowing}
              />
            </div>
          </div>
        </div>

        {/* Dueño, siempre visible y con link al perfil humano */}
        {owner ? (
          <div className="flex items-center gap-2 border-t-2 border-ink bg-cream/60 px-5 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50">
              su dueño
            </span>
            <Link
              href={withFrom(`/proto/users/${owner.id}`, `/proto/pets/${petId}`)}
              className="group inline-flex items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={owner.avatar}
                alt={owner.nombre}
                className="h-6 w-6 rounded-full border-2 border-ink object-cover"
              />
              <span className="text-sm font-bold text-ink/80 underline-offset-4 group-hover:underline">
                {owner.nombre}
              </span>
            </Link>
          </div>
        ) : null}
      </header>

      {/* Secciones navegables. Calendario es global, como en la app real. */}
      <nav className="mb-8 flex flex-wrap items-center gap-1.5">
        {visibleSections.map(({ key, label, Icon, tone }) => (
          <Link
            key={key}
            href={withFrom(
              `/proto/pets/${petId}${key === "lovis" ? "" : `/${key}`}`,
              `/proto/pets/${petId}`,
            )}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-ink px-3 py-1.5",
              "text-[10px] font-bold uppercase tracking-widest transition-transform",
              "hover:-translate-y-0.5",
              tone,
              "text-ink",
            )}
          >
            <Icon size={13} strokeWidth={2.5} />
            {label}
            <span className="opacity-60">{counts[key]}</span>
          </Link>
        ))}

        {/* El calendario es privado: solo desde una mascota propia */}
        {isOwner ? (
          <Link
            href="/proto/calendar"
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-ink px-3 py-1.5",
              "text-[10px] font-bold uppercase tracking-widest transition-transform",
              "hover:-translate-y-0.5",
              "bg-navy text-cream",
            )}
          >
            <CalendarDays size={13} strokeWidth={2.5} />
            Calendario
          </Link>
        ) : null}
      </nav>

      {/* Cabecera de la sección: título + acción de creación (solo dueño) */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Recuerdos
        </h2>
        {isOwner ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            className="inline-flex items-center gap-1.5 border-2 border-ink bg-orange px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink transition-transform hover:-translate-y-0.5"
          >
            <Plus size={13} strokeWidth={2.5} />
            Crear recuerdo
          </button>
        ) : null}
      </div>

      {/* Formulario de creación: se abre/cierra con el botón de arriba. */}
      {isOwner && showForm ? (
        <ProtoLoviForm
          petId={petId}
          petName={pet.name}
          onCreated={() => setShowForm(false)}
        />
      ) : null}

      {lovis.length === 0 ? (
        <p className="card-lovi px-5 py-8 text-center text-sm text-ink/60">
          {ready && createdReady
            ? "Esta mascota todavía no tiene recuerdos en el prototipo."
            : "Cargando recuerdos…"}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {lovis.map((lovi, i) => (
            <FeedCard
              key={lovi.id}
              lovi={lovi}
              from={`/proto/pets/${petId}`}
              tilt={i % 2 === 0 ? 1 : -1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
