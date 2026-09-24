"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";

import { ProfileForm } from "@/components/profile-form";

export function ProfileEdit({
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
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="btn-ink"
      >
        {editing ? <X size={16} /> : <Pencil size={16} />}
        {editing ? "Cancelar" : "Editar perfil"}
      </button>
      {editing ? (
        <ProfileForm
          nombre={nombre}
          email={email}
          previewUrl={previewUrl}
          imagePath={imagePath}
        />
      ) : null}
    </div>
  );
}