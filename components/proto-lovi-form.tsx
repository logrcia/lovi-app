"use client";

import { useState } from "react";
import {
  AudioLines,
  FileText,
  Film,
  ImageIcon,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/form";
import { useMockCreatedLovis } from "@/lib/mock-data/created-lovis";
import type { MediaKind } from "@/lib/mock-data/types";

/**
 * Formulario de creación de recuerdo del prototipo.
 *
 * Variación de LoviForm (components/lovi-form.tsx) para el entorno mock:
 *   - La mascota NO se elige: viene preseleccionada por estar en su perfil.
 *   - No hay upload real: el tipo de medio se simula con un selector
 *     (Foto / Video / Audio / Solo texto) y placeholders SVG.
 *   - El submit es sincrónico: llama addLovi del provider y cierra.
 *
 * Copia y estilos calcados de LoviForm para que la validación de UX del
 * prototipo sea representativa de la app real.
 */

type MediaChoice = MediaKind | null;

const MEDIA_OPTIONS: {
  kind: MediaChoice;
  label: string;
  Icon: typeof ImageIcon;
}[] = [
  { kind: "image", label: "Foto", Icon: ImageIcon },
  { kind: "video", label: "Video", Icon: Film },
  { kind: "audio", label: "Audio", Icon: AudioLines },
  { kind: null, label: "Solo texto", Icon: FileText },
];

export function ProtoLoviForm({
  petId,
  petName,
  onCreated,
}: {
  petId: string;
  petName: string;
  onCreated: () => void;
}) {
  const { addLovi } = useMockCreatedLovis();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // null = "Solo texto": el caso más simple del prototipo es el default.
  const [mediaKind, setMediaKind] = useState<MediaChoice>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // evita doble submit / duplicar el recuerdo
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("El título es obligatorio.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    addLovi({
      petId,
      title: trimmedTitle,
      description: description.trim() || null,
      mediaKind,
    });
    // Reset total: un segundo recuerdo arranca limpio.
    setTitle("");
    setDescription("");
    setMediaKind(null);
    setIsSubmitting(false);
    onCreated();
  };

  return (
    <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-5 p-6 mb-8">
      {/* La mascota viene preseleccionada: es la dueña de este perfil. */}
      <p className="sticker self-start bg-butter text-ink">Para: {petName}</p>

      <Field label="Título" htmlFor="proto_lovi_title">
        <TextInput
          id="proto_lovi_title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="El día que conoció el agua…"
          required
        />
      </Field>

      <Field label="Contame más" htmlFor="proto_lovi_description">
        <TextArea
          id="proto_lovi_description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cómo fue, qué sentiste, qué le dirías…"
        />
      </Field>

      {/* Selector de tipo de medio: no hay upload real en el prototipo. */}
      <Field
        label="¿Qué querés guardar?"
        hint="En el prototipo el medio se simula con placeholders."
      >
        <div className="flex flex-wrap gap-2">
          {MEDIA_OPTIONS.map(({ kind, label, Icon }) => {
            const selected = mediaKind === kind;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={selected}
                onClick={() => setMediaKind(kind)}
                className={
                  selected
                    ? "inline-flex items-center gap-1.5 border-2 border-ink bg-fucsia px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cream"
                    : "inline-flex items-center gap-1.5 border-2 border-ink bg-parchment px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-butter"
                }
              >
                <Icon size={13} strokeWidth={2.5} />
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      {error && (
        <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange font-bold uppercase tracking-wider text-ink shadow-sticker-sm hover:rotate-1 hover:bg-butter"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Guardando…
            </>
          ) : (
            "Guardar recuerdo ✦"
          )}
        </Button>
        {/* Cerrar sin guardar: el form es efímero, no navega. */}
        <button type="button" onClick={onCreated} className="btn-ghost-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
