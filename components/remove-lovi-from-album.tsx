"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import { removeLoviFromAlbum } from "@/lib/actions";

export function RemoveLoviFromAlbum({ petId, albumId, loviId }: { petId: string; albumId: string; loviId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onRemove = () => {
    startTransition(async () => {
      const result = await removeLoviFromAlbum(petId, albumId, loviId);
      if (!result.ok) console.error(result.error);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={isPending}
      aria-label="Quitar del álbum"
      className="inline-flex items-center gap-1 rounded-full border-2 border-ink/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/50 transition-all hover:border-fucsia hover:text-fucsia"
    >
      {isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
      Quitar
    </button>
  );
}