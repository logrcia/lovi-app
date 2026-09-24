"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { deleteVaccine } from "@/lib/actions";

export function DeleteVaccineButton({ petId, vacId }: { petId: string; vacId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteVaccine(petId, vacId);
      setConfirming(false);
      if (!result.ok) console.error(result.error);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isPending}
      aria-label="Borrar vacuna"
      className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
        confirming
          ? "border-fucsia bg-fucsia text-cream"
          : "border-ink/30 text-ink/50 hover:border-fucsia hover:text-fucsia"
      }`}
    >
      {isPending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <>
          <Trash2 size={12} />
          {confirming ? "¿Seguro?" : "Borrar"}
        </>
      )}
    </button>
  );
}