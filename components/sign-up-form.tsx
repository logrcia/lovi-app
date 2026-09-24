"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "border-2 border-ink bg-cream focus-visible:ring-fucsia";

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSignUp} className="card-lovi flex flex-col gap-5 p-6">
        <div className="grid gap-2">
          <Label htmlFor="nombre" className="text-ink">
            Tu nombre
          </Label>
          <Input
            id="nombre"
            type="text"
            placeholder="Ana"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-ink">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vos@ejemplo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-ink">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat-password" className="text-ink">
            Repetir contraseña
          </Label>
          <Input
            id="repeat-password"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && (
          <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-fucsia">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full bg-orange font-bold uppercase tracking-wider text-ink shadow-sticker-sm hover:bg-butter"
          disabled={isLoading}
        >
          {isLoading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-fucsia underline-offset-4 hover:underline"
          >
            Ingresá
          </Link>
        </p>
      </form>
    </div>
  );
}