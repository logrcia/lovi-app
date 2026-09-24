"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/form";
import { createAlbum } from "@/lib/actions";

export function AlbumForm({ petId }: { petId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createAlbum({ pet_id: petId, title, description: description || null });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/pets/${petId}/albums/${result.album_id}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-5 p-6">
      <Field label="Nombre del álbum" htmlFor="album_title">
        <TextInput
          id="album_title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Sus primeros meses"
          required
        />
      </Field>
      <Field label="Descripción" htmlFor="album_description" hint="Opcional.">
        <TextArea
          id="album_description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Qué hay adentro de este álbum…"
        />
      </Field>

      {error && (
        <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-orange font-bold uppercase tracking-wider text-ink shadow-sticker-sm hover:rotate-1 hover:bg-butter"
        >
          {isPending ? <Loader2 className="animate-spin" /> : "Crear álbum"}
        </Button>
        <button type="button" onClick={() => router.back()} className="btn-ghost-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}