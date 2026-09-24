"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/form";
import { createClient } from "@/lib/supabase/client";
import { uploadProfileImage } from "@/lib/storage";
import { updateProfile } from "@/lib/actions";

export function ProfileForm({
  nombre,
  email,
  previewUrl,
  imagePath,
}: {
  nombre: string;
  email: string | null;
  previewUrl: string | null;
  imagePath: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(nombre);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [existingImagePath] = useState<string | null>(imagePath); // path crudo del server
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("La imagen de perfil debe ser una imagen.");
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

      let imagePath = existingImagePath;
      if (file) {
        const res = await uploadProfileImage(supabase, user.id, file);
        if (!res.ok) throw new Error(res.error);
        imagePath = res.path;
      }

      const result = await updateProfile({ nombre: name, image: imagePath });
      if (!result.ok) throw new Error(result.error);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
      setIsSubmitting(false);
    }
  };

  const onLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const shownPreview = localPreview ?? previewUrl;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-5 p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex items-center gap-4 rounded-lg border-2 border-dashed border-ink/60 bg-cream p-3 text-left transition-colors hover:border-ink"
          >
            {shownPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownPreview}
                alt="Vista previa del perfil"
                className="h-20 w-20 shrink-0 rounded-full border-2 border-ink object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-butter">
                <ImagePlus size={26} strokeWidth={2.25} />
              </span>
            )}
            <span className="text-sm font-bold uppercase tracking-wide text-ink">
              {file || previewUrl ? "Cambiar foto" : "Elegir foto"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Field label="Tu nombre" htmlFor="profile-name">
          <TextInput
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <Field label="Email" htmlFor="profile-email" hint="El email no se puede cambiar desde acá.">
          <TextInput id="profile-email" value={email ?? ""} readOnly className="opacity-70" />
        </Field>

        {error && (
          <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        <div>
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
              "Guardar perfil"
            )}
          </Button>
        </div>
      </form>

      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className="btn-ghost-ink self-start border-fucsia text-fucsia hover:bg-fucsia hover:text-cream"
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="animate-spin" /> Cerrando sesión…
          </>
        ) : (
          <>
            <LogOut size={16} /> Cerrar sesión
          </>
        )}
      </button>
    </div>
  );
}