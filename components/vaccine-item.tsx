"use client";

import { useState } from "react";
import { Pencil, Syringe } from "lucide-react";

import { VaccineForm } from "@/components/vaccine-form";
import { DeleteVaccineButton } from "@/components/delete-vaccine-button";
import { formatFullDate } from "@/lib/format";
import type { Vaccine } from "@/lib/types";

export function VaccineItem({ petId, vaccine }: { petId: string; vaccine: Vaccine }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <VaccineForm
        petId={petId}
        initial={vaccine}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-butter">
        <Syringe size={17} strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{vaccine.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFullDate(vaccine.date)}
          {vaccine.next_dose ? ` · próxima: ${formatFullDate(vaccine.next_dose)}` : ""}
        </p>
        {vaccine.notes ? <p className="mt-1 text-xs italic text-ink/70">{vaccine.notes}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Editar vacuna"
          className="inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all border-ink/30 text-ink/50 hover:border-ink hover:text-ink"
        >
          <Pencil size={12} />
          Editar
        </button>
        <DeleteVaccineButton petId={petId} vacId={vaccine.vac_id} />
      </div>
    </div>
  );
}