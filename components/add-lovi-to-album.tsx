"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { addLoviToAlbum } from "@/lib/actions";
import type { LoviWithMedia } from "@/lib/types";

export function AddLoviToAlbum({ petId, albumId, lovis }: { petId: string; albumId: string; lovis: LoviWithMedia[] }) {
  const router = useRouter();
  const [loviId, setLoviId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (lovis.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No quedan recuerdos sin agrupar: lovialos y después volvé a agregarlos acá.
      </p>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loviId) return;
    setError(null);
    startTransition(async () => {
      const result = await addLoviToAlbum(petId, albumId, loviId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLoviId("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
      <select
        value={loviId}
        onChange={(e) => setLoviId(e.target.value)}
        required
        className="border-2 border-ink bg-cream px-3 py-2 font-sans text-sm text-ink rounded-none"
      >
        <option value="" disabled>
          Elegí un recuerdo…
        </option>
        {lovis.map((l) => (
          <option key={l.lovi_id} value={l.lovi_id}>
            {l.title} · {l.pet_name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending || !loviId}
        className="btn-loviar disabled:opacity-50"
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Plus size={16} />} Agregar
      </button>
      {error ? <span className="text-sm font-semibold text-fucsia">{error}</span> : null}
    </form>
  );
}