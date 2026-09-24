"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="sticker bg-fucsia text-cream">algo salió mal</p>
      <h1 className="lovi-headline">Ups, se nos cayó el diario.</h1>
      <p className="text-sm text-muted-foreground">
        Pasó un error inesperado al cargar esta página. Podés reintentar; los
        recuerdos siguen guardados.
      </p>
      <button type="button" onClick={reset} className="btn-loviar">
        Reintentar
      </button>
    </div>
  );
}