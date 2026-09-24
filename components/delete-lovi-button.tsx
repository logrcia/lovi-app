"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { deleteLovi } from "@/lib/actions";

export function DeleteLoviButton({ loviId }: { loviId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteLovi(loviId);
      if (result.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        // fallback simple: recarga para reflejar el error en consola
        console.error(result.error);
        setConfirming(false);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isPending}
      aria-label="Borrar recuerdo"
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