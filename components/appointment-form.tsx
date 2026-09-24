"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/form";
import { createAppointment } from "@/lib/actions";

export function AppointmentForm({ petId }: { petId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // datetime-local -> ISO para timestamptz
      const iso = date ? new Date(date).toISOString() : "";
      const result = await createAppointment({
        pet_id: petId,
        name,
        date: iso,
        description: description || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setDate("");
      setDescription("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="card-lovi flex flex-col gap-4 px-5 py-5">
      <div className="flex items-center gap-2">
        <CalendarHeart size={18} strokeWidth={2.25} className="text-ink/70" />
        <h3 className="font-display text-xl font-semibold text-ink">Cargar turno</h3>
      </div>

      <Field label="Nombre" htmlFor="ap-name">
        <TextInput
          id="ap-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Veterinaria, Peluquería, Ecografía…"
          required
        />
      </Field>

      <Field label="Fecha y hora" htmlFor="ap-date">
        <TextInput id="ap-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>

      <Field label="Descripción" htmlFor="ap-description" hint="Opcional.">
        <TextArea
          id="ap-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Qué tienen que saber en el turno…"
        />
      </Field>

      {error && (
        <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-ink">{error}</p>
      )}

      <div>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-fucsia font-bold uppercase tracking-wider text-cream shadow-sticker-sm hover:rotate-1 hover:bg-orange hover:text-ink"
        >
          {isPending ? <Loader2 className="animate-spin" /> : "Guardar turno"}
        </Button>
      </div>
    </form>
  );
}