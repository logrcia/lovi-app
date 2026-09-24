"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/form";
import { createClient } from "@/lib/supabase/client";
import { uploadPetImage } from "@/lib/storage";
import { createPet, updatePet } from "@/lib/actions";
import type { Pet } from "@/lib/types";

const SPECIES = ["Perro", "Gato", "Pájaro", "Conejo", "Pez", "Hamster", "Tortuga", "Otro"];

export function PetForm({
  pet,
  previewUrl,
}: {
  pet?: Pet; // presente => modo edición
  previewUrl?: string | null; // url ya firmada de la imagen actual (edición)
}) {
  const router = useRouter();
  const [petName, setPetName] = useState(pet?.pet_name ?? "");
  const [especie, setEspecie] = useState(pet?.especie ?? "");
  const [birthDate, setBirthDate] = useState(pet?.birth_date ?? "");
  const [description, setDescription] = useState(pet?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [existingImagePath] = useState(pet?.image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("La foto debe ser una imagen (jpg, png, webp…).");
      return;
    }
    setError(null);
    setFile(f);
    setLocalPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado.");

      // Si eligieron foto nueva, subirla y persistir el path; si no, el path previo.
      let imagePath = existingImagePath;
      if (file) {
        const res = await uploadPetImage(supabase, user.id, file);
        if (!res.ok) throw new Error(res.error);
        imagePath = res.path;
      }

      const input = {
        pet_name: petName,
        especie,
        birth_date: birthDate || null,
        description: description || null,
        image: imagePath,
      };

      const result = pet
        ? await updatePet(pet.pet_id, input)
        : await createPet(input);
      if (!result.ok) throw new Error(result.error);

      if (pet) {
        router.push(`/pets/${pet.pet_id}`);
      } else {
        router.push("/pets");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
      setIsSubmitting(false);
    }
  };

  const shownPreview = localPreview ?? previewUrl ?? null;

  return (
    <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-5 p-6">
      {/* Foto */}
      <Field label="Foto de la mascota" hint="Opcional. Se guarda en el álbum privado de Lovi.">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex items-center gap-4 rounded-lg border-2 border-dashed border-ink/60 bg-cream p-3 text-left transition-colors hover:border-ink"
        >
          {shownPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownPreview}
              alt="Vista previa de la mascota"
              className="h-20 w-20 shrink-0 rounded-lg border-2 border-ink object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-butter">
              <ImagePlus size={26} strokeWidth={2.25} />
            </span>
          )}
          <span className="text-sm font-bold uppercase tracking-wide text-ink">
            {file || previewUrl ? "Cambiar foto" : "Elegir una foto"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </Field>

      <Field label="Nombre" htmlFor="pet_name">
        <TextInput
          id="pet_name"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Ej: Mica"
          required
        />
      </Field>

      <Field label="Especie" htmlFor="especie">
        <Select
          id="especie"
          value={especie}
          onChange={(e) => setEspecie(e.target.value)}
          required
        >
          <option value="" disabled>
            Elegí una especie
          </option>
          {SPECIES.map((s) => (
            <option key={s} value={s.toLowerCase()}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Fecha de nacimiento" htmlFor="birth_date" hint="Opcional. Se usa para calcular su edad.">
        <TextInput
          id="birth_date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </Field>

      <Field label="Descripción" htmlFor="description" hint="Opcional. Ese detalle que la hace única.">
        <TextArea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Su comida favorita, sus mañas…"
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
          disabled={isSubmitting}
          className="bg-orange font-bold uppercase tracking-wider text-ink shadow-sticker-sm hover:rotate-1 hover:bg-butter"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Guardando…
            </>
          ) : pet ? (
            "Guardar cambios"
          ) : (
            "Crear mascota"
          )}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}