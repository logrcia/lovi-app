"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/form";
import { createPetExam, updatePetExam } from "@/lib/actions";
import type { PetExam } from "@/lib/types";

export function PetExamForm({
  petId,
  initial,
  onSaved,
  onCancel,
}: {
  petId: string;
  initial?: PetExam | null;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.exam_date ?? "");
  const [result, setResult] = useState(initial?.result ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const actionResult = initial
        ? await updatePetExam(initial.exam_id, petId, {
            name,
            exam_date: date,
            result: result || null,
            notes: notes || null,
          })
        : await createPetExam({
            pet_id: petId,
            name,
            exam_date: date,
            result: result || null,
            notes: notes || null,
          });
      if (!actionResult.ok) {
        setError(actionResult.error);
        return;
      }
      if (onSaved) {
        onSaved();
      } else {
        setName("");
        setDate("");
        setResult("");
        setNotes("");
      }
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-4 px-5 py-5">
      <div className="flex items-center gap-2">
        <Stethoscope size={18} strokeWidth={2.25} className="text-ink/70" />
        <h3 className="font-display text-xl font-semibold text-ink">
          {initial ? "Editar estudio" : "Cargar estudio"}
        </h3>
      </div>

      <Field label="Nombre del estudio" htmlFor="exam-name">
        <TextInput
          id="exam-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Ecografía, Análisis de sangre, Control dental…"
          required
        />
      </Field>

      <Field label="Fecha" htmlFor="exam-date">
        <TextInput id="exam-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>

      <Field label="Resultado o descripción" htmlFor="exam-result" hint="Opcional.">
        <TextArea
          id="exam-result"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          placeholder="Ej: Todo normal, cálculos renales…"
        />
      </Field>

      <Field label="Nota" htmlFor="exam-notes" hint="Opcional.">
        <TextArea
          id="exam-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: lo hizo la Dra. Pérez"
        />
      </Field>

      {error && (
        <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-ink">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-navy font-bold uppercase tracking-wider text-cream shadow-sticker-sm hover:rotate-1 hover:bg-butter hover:text-ink"
        >
          {isPending ? <Loader2 className="animate-spin" /> : initial ? "Guardar cambios" : "Guardar estudio"}
        </Button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn-ghost-ink">
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}