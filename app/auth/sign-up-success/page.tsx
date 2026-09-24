import { AuthShell } from "@/components/auth-shell";
import { LoviWordmark } from "@/components/lovi-wordmark";

export default function Page() {
  return (
    <AuthShell eyebrow="casi listo">
      <div className="card-lovi flex flex-col gap-4 p-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Revisá tu casilla de email
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Te enviamos un link para confirmar tu cuenta. Hasta que lo actives no
          vas a poder ingresar.
        </p>
        <p className="text-xs text-muted-foreground">
          ¿Este lugar te suena?{" "}
          <LoviWordmark size="md" className="align-middle" />
        </p>
      </div>
    </AuthShell>
  );
}