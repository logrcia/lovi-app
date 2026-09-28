"use client";

import { useState } from "react";
import { Pencil, Stethoscope } from "lucide-react";

import { PetExamForm } from "@/components/pet-exam-form";
import { DeletePetExamButton } from "@/components/delete-pet-exam-button";
import { formatFullDate } from "@/lib/format";
import type { PetExam } from "@/lib/types";

export function PetExamItem({ petId, exam }: { petId: string; exam: PetExam }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PetExamForm
        petId={petId}
        initial={exam}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-orange">
        <Stethoscope size={17} strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{exam.name}</p>
        <p className="text-xs text-muted-foreground">{formatFullDate(exam.exam_date)}</p>
        {exam.result ? <p className="mt-1 text-xs text-ink/70">{exam.result}</p> : null}
        {exam.notes ? <p className="mt-1 text-xs italic text-ink/70">{exam.notes}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Editar estudio"
          className="inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all border-ink/30 text-ink/50 hover:border-ink hover:text-ink"
        >
          <Pencil size={12} />
          Editar
        </button>
        <DeletePetExamButton petId={petId} examId={exam.exam_id} />
      </div>
    </div>
  );
}