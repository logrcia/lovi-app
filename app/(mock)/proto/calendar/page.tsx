import { Suspense } from "react";

import { ProtoCalendar } from "@/components/proto-calendar";

export const metadata = {
  title: "Calendario · prototipo Lovi",
};

export default function ProtoCalendarPage() {
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-ink/60">
          Cargando calendario…
        </p>
      }
    >
      <ProtoCalendar />
    </Suspense>
  );
}
