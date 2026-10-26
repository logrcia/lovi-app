"use client";

import Link from "next/link";
import { CalendarDays, CalendarHeart, FolderHeart, Stethoscope } from "lucide-react";

import { ProtoBackLink, withFrom } from "@/components/proto-back-link";
import { getMockPet, getMockUser } from "@/lib/mock-data";
import {
  getMockAlbums,
  getMockAppointmentsSplit,
  getMockVaccines,
  type MockAlbum,
  type MockAppointment,
  type MockVaccine,
} from "@/lib/mock-data/pet-sections";
import { cn } from "@/lib/utils";

/**
 * Shell compartido de las secciones secundarias de una mascota
 * (Álbumes, Vacunas, Turnos) en el prototipo.
 *
* Los datos salen de lib/mock-data/pet-sections.ts. No hay writes, no hay
 * queries y no hay gating por follow: en esta etapa el prototipo valida
 * lectura y jerarquía visual, no permisos.
 *
 * Es un Client Component porque "turnos próximos vs anteriores" depende del
 * ahora, y un new Date() en un Server Component rompe el prerender estatico.
 */

type Kind = "albums" | "vaccines" | "appointments";

const SECTION_META: Record<
  Kind,
  { label: string; singular: string; Icon: typeof FolderHeart; tone: string }
> = {
  albums: { label: "Álbumes", singular: "álbum", Icon: FolderHeart, tone: "bg-butter" },
  vaccines: {
    label: "Vacunas",
    singular: "vacuna",
    Icon: Stethoscope,
    tone: "bg-butter",
  },
  appointments: {
    label: "Turnos",
    singular: "turno",
    Icon: CalendarHeart,
    tone: "bg-fucsia",
  },
};

const KIND_LABEL: Record<string, string> = {
  veterinario: "Veterinario",
  peluqueria: "Peluquería",
  vacunacion: "Vacunación",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function SectionHeader({
  kind,
  petId,
  petName,
}: {
  kind: Kind;
  petId: string;
  petName: string;
}) {
  const { label, Icon, tone } = SECTION_META[kind];
  return (
    <header className="mb-8">
      <ProtoBackLink
        label={petName.toLowerCase()}
        fallback={`/proto/pets/${petId}`}
      />
      <div className="flex items-center gap-4">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink ${tone}`}
        >
          <Icon size={22} strokeWidth={2.25} />
        </span>
        <div>
          <p className="sticker bg-butter text-ink">{label.toLowerCase()}</p>
          <h1 className="lovi-headline mt-2 !text-4xl">{petName}</h1>
        </div>
      </div>
    </header>
  );
}

function AlbumList({ albums }: { albums: MockAlbum[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {albums.map((a) => (
        <li key={a.id} className="card-lovi overflow-hidden">
          <Link
            href={withFrom(
              `/proto/pets/${a.petId}/albums/${a.id}`,
              `/proto/pets/${a.petId}/albums`,
            )}
            className="group block transition-transform hover:-translate-y-0.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.cover}
              alt={a.title}
              className="h-40 w-full border-b-2 border-ink object-cover"
            />
            <div className="p-4">
              <h2 className="font-display text-xl font-semibold text-ink underline-offset-4 group-hover:underline">
                {a.title}
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-ink/55">
                {a.loviCount} {a.loviCount === 1 ? "recuerdo" : "recuerdos"} ·{" "}
                {formatDate(a.createdAt)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function VaccineList({ vaccines }: { vaccines: MockVaccine[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {vaccines.map((v) => {
        const overdue =
          v.nextDueAt !== null && new Date(v.nextDueAt).getTime() < Date.now();
        return (
          <li key={v.id} className="card-lovi p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">
                {v.name}
              </h2>
              <span
                className={`sticker ${overdue ? "bg-fucsia text-cream" : "bg-cream text-ink"}`}
              >
                {overdue ? "para repetir" : "al día"}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-ink/55">
              aplicada {formatDate(v.appliedAt)}
              {v.nextDueAt
                ? ` · próxima ${formatDate(v.nextDueAt)}`
                : " · sin próxima"}
            </p>
            {v.notes ? (
              <p className="mt-2 text-sm italic text-ink/70">{v.notes}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function AppointmentList({
  upcoming,
  past,
  singular,
}: {
  upcoming: MockAppointment[];
  past: MockAppointment[];
  singular: string;
}) {
  const item = (a: MockAppointment) => {
    const d = new Date(a.at);
    return (
      <li key={a.id} className="card-lovi flex items-center gap-4 p-4">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border-2 border-ink bg-parchment py-1.5">
          <span className="font-display text-2xl font-bold leading-none text-ink">
            {d.getUTCDate()}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-ink/60">
            {d.toLocaleDateString("es-AR", { month: "short", timeZone: "UTC" })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight text-ink">
            {a.title}
          </h3>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-ink/55">
            {KIND_LABEL[a.kind] ?? a.kind} ·{" "}
            {d.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            })}
          </p>
          {a.notes ? (
            <p className="mt-1.5 text-sm italic text-ink/70">{a.notes}</p>
          ) : null}
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 font-display text-2xl font-semibold text-ink">
          Próximos
        </h2>
        {upcoming.length === 0 ? (
          <p className="card-lovi px-5 py-6 text-center text-sm text-ink/60">
            No hay {singular}s agendados en el prototipo.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">{upcoming.map(item)}</ul>
        )}
      </section>

      {past.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-2xl font-semibold text-ink/50">
            Anteriores
          </h2>
          <ul className="flex flex-col gap-3 opacity-70">{past.map(item)}</ul>
        </section>
      ) : null}
    </div>
  );
}

export function ProtoPetSection({ petId, kind }: { petId: string; kind: Kind }) {
  const pet = getMockPet(petId);
  if (!pet) return null;

  const owner = getMockUser(pet.ownerId);
  const { singular } = SECTION_META[kind];

  return (
    <div>
      <SectionHeader kind={kind} petId={petId} petName={pet.name} />

      {owner ? (
        <p className="mb-6 text-sm text-ink/70">
          mascota de{" "}
          <span className="font-bold text-ink/80">{owner.nombre}</span> ·{" "}
          {pet.ageLabel}
        </p>
      ) : null}

      {kind === "albums" ? <AlbumList albums={getMockAlbums(petId)} /> : null}
      {kind === "vaccines" ? (
        <VaccineList vaccines={getMockVaccines(petId)} />
      ) : null}
      {kind === "appointments" ? (
        <AppointmentList
          {...getMockAppointmentsSplit(petId, new Date().toISOString())}
          singular={singular}
        />
      ) : null}

      {/* UN boton de calendario, no dos. Antes estaba uno en el header de la
          seccion y otro en el body, y los dos llevaba al mismo lado: el
          usuario veia el mismo acceso repetido. Queda solo el del body, que
          es el que se lee al terminar de mirar la lista.

          Solo en Vacunas y Turnos: son las dos secciones que dependen de una
          fecha. En Albums un calendario no aporta nada. */}
      {kind === "vaccines" || kind === "appointments" ? (
        <div className="mt-8 flex justify-center">
          <Link
            href={withFrom("/proto/calendar", `/proto/pets/${petId}/${kind}`)}
            className={cn(
              "inline-flex items-center gap-2 border-2 border-ink px-4 py-2",
              "text-[10px] font-bold uppercase tracking-widest",
              "transition-transform hover:-translate-y-0.5",
              "bg-navy text-cream",
            )}
          >
            <CalendarDays size={14} strokeWidth={2.5} />
            ver en el calendario
          </Link>
        </div>
      ) : null}

      <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35">
        {kind === "albums"
          ? "datos simulados · sin escritura"
          : "privado · solo su dueño lo ve · datos simulados"}
      </p>
    </div>
  );
}
