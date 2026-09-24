"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, ImagePlus, Loader2, Mic, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput, Select } from "@/components/form";
import { createClient } from "@/lib/supabase/client";
import { uploadLoviMedia } from "@/lib/storage";
import { createLovi } from "@/lib/actions";
import type { MediaType, Pet } from "@/lib/types";

type PickedFile = {
  id: string;
  file: File;
  preview: string | null; // objectURL para imágenes, null para video/audio
  kind: "image" | "video" | "audio";
};

function kindOf(mime: string): PickedFile["kind"] | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
}

export function LoviForm({
  pets,
  initialPetId,
}: {
  pets: Pet[];
  initialPetId?: string;
}) {
  const router = useRouter();
  // Preselección por URL (?pet=...): SOLO si la mascota existe en la lista;
  // si no, arranca vacío (resetForm sigue limpiando a "").
  const [petId, setPetId] = useState(() =>
    initialPetId && pets.some((p) => p.pet_id === initialPetId) ? initialPetId : "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Los archivos ya subidos a storage (para no re-subir si el insert falla)
  const [uploaded, setUploaded] = useState<{ path: string; mediaType: MediaType }[]>([]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: PickedFile[] = [];
    for (const f of Array.from(list)) {
      const kind = kindOf(f.type);
      if (!kind) {
        setError(`${f.name}: formato no soportado.`);
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file: f,
        preview: kind === "image" ? URL.createObjectURL(f) : null,
        kind,
      });
    }
    if (next.length > 0) {
      setError(null);
      setFiles((prev) => [...prev, ...next]);
    }
  };

  const revokePreviews = (list: PickedFile[]) => {
    for (const f of list) {
      if (f.preview) URL.revokeObjectURL(f.preview);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Reset TOTAL del formulario tras publicar: sin restos del Lovi anterior
  // (estado, previews y referencias de upload) para que un segundo Lovi
  // arranque limpio aunque se vuelva a /loviar desde la caché del router.
  const resetForm = () => {
    setPetId("");
    setTitle("");
    setDescription("");
    setFiles([]);
    setUploaded([]);
    setError(null);
    setIsSubmitting(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // evita doble submit / duplicar el Lovi
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado.");

      // Subir solo los archivos NO subidos aún.
      const fresh = files.slice(uploaded.length);
      const nextUploaded = [...uploaded];
      for (const picked of fresh) {
        const res = await uploadLoviMedia(supabase, user.id, picked.file);
        if (!res.ok) {
          setError(`No se pudo subir ${picked.file.name}: ${res.error}`);
          setIsSubmitting(false);
          return;
        }
        nextUploaded.push({ path: res.path, mediaType: res.mediaType ?? "image" });
      }
      // Almacenar para no re-subir si el insert falla y el usuario reintenta.
      setUploaded(nextUploaded);

      const result = await createLovi({
        pet_id: petId,
        title,
        description: description || null,
        media: nextUploaded.map((m, i) => ({
          media_url: m.path,
          media_type: m.mediaType,
          position: i,
        })),
      });
      if (!result.ok) throw new Error(result.error);

      // Éxito: revocar los object URLs de los previews y limpiar TODO el
      // estado ANTES de navegar. Si Next restaura /loviar desde la caché
      // del router (back / nav), el formulario vuelve limpio.
      revokePreviews(files);
      resetForm();
      router.push(result.lovi_id ? `/pets/${petId}` : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-5 p-6">
      <Field label="Mascota" htmlFor="pet_id" hint="¿A quién le estate loviando?">
        <Select required value={petId} onChange={(e) => setPetId(e.target.value)}>
          <option value="" disabled>
            Elegí una mascota
          </option>
          {pets.map((p) => (
            <option key={p.pet_id} value={p.pet_id}>
              {p.pet_name} · {p.especie}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Título" htmlFor="lovi_title">
        <TextInput
          id="lovi_title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="El día que conoció el agua…"
          required
        />
      </Field>

      <Field label="Contame más" htmlFor="lovi_description">
        <TextArea
          id="lovi_description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cómo fue, qué sentiste, qué le dirías…"
        />
      </Field>

      {/* Archivos */}
      <Field
        label="Fotos, videos o audios"
        hint="Podés subir varios juntos. Se guardan en el álbum privado."
      >
        <label
          htmlFor="lovi-files"
          className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-ink/60 bg-cream px-4 py-6 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink hover:bg-butter/50"
        >
          <ImagePlus size={20} />
          Agregar archivos
        </label>
        <input
          id="lovi-files"
          type="file"
          accept="image/*,video/*,audio/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </Field>

      {files.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((f) => (
            <li key={f.id} className="relative aspect-square overflow-hidden rounded-lg border-2 border-ink">
              {f.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className={`flex h-full w-full items-center justify-center ${f.kind === "video" ? "bg-navy text-cream" : "bg-fucsia text-cream"}`}>
                  {f.kind === "video" ? <Film size={22} /> : <Mic size={22} />}
                </span>
              )}
              <button
                type="button"
                aria-label={`Quitar ${f.file.name}`}
                onClick={() => removeFile(f.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-butter text-ink transition-colors hover:bg-fucsia hover:text-cream"
              >
                <X size={13} strokeWidth={3} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error && (
        <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || files.length === 0}
          className="bg-orange font-bold uppercase tracking-wider text-ink shadow-sticker-sm hover:rotate-1 hover:bg-butter"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Loviano…
            </>
          ) : (
            "Loviar ✦"
          )}
        </Button>
        <button type="button" onClick={() => router.back()} className="btn-ghost-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}