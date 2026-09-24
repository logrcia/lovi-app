"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Syringe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/form";
import { createVaccine } from "@/lib/actions";

export function VaccineForm({ petId }: { petId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [nextDose, setNextDose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createVaccine({
        pet_id: petId,
        name,
        date,
        next_dose: nextDose || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setDate("");
      setNextDose("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-4 px-5 py-5">
      <div className="flex items-center gap-2">
        <Syringe size={18} strokeWidth={2.25} className="text-ink/70" />
        <h3 className="font-display text-xl font-semibold text-ink">Cargar vacuna</h3>
      </div>

      <Field label="Nombre" htmlFor="vac-name">
        <TextInput
          id="vac-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Antirrábica, Quíntuple, Pipeta…"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha" htmlFor="vac-date">
          <TextInput id="vac-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Próxima dosis" htmlFor="vac-next" hint="Opcional.">
          <TextInput id="vac-next" type="date" value={nextDose} onChange={(e) => setNextDose(e.target.value)} />
        </Field>
      </div>

      {error && (
        <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-ink">{error}</p>
      )}

      <div>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-navy font-bold uppercase tracking-wider text-cream shadow-sticker-sm hover:rotate-1 hover:bg-butter hover:text-ink"
        >
          {isPending ? <Loader2 className="animate-spin" /> : "Guardar vacuna"}
        </Button>
      </div>
    </form>
  );
}