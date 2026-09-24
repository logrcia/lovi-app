"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { deleteAlbum } from "@/lib/actions";

export function DeleteAlbumButton({ petId, albumId }: { petId: string; albumId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteAlbum(petId, albumId);
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
      aria-label="Borrar álbum"
      className={`mt-2 inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
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
          {confirming ? "¿Seguro?" : "Borrar álbum"}
        </>
      )}
    </button>
  );
}