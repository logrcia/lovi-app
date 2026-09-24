import { cn } from "@/lib/utils";
import type { CalendarMark } from "@/lib/types";

const KIND_DOT: Record<CalendarMark["kind"], string> = {
  lovi: "bg-orange",
  vaccine: "bg-navy",
  appointment: "bg-fucsia",
  birthday: "bg-butter",
};

export function CalLabel({ kind, label }: { kind: CalendarMark["kind"]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-ink/70">
      <span className={cn("h-2.5 w-2.5 rounded-full", KIND_DOT[kind])} />
      {label}
    </span>
  );
}