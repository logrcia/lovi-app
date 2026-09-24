"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form
        onSubmit={handleLogin}
        className="card-lovi flex flex-col gap-5 p-6"
      >
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
            className="border-2 border-ink bg-cream focus-visible:ring-fucsia"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password" className="text-ink">
              Contraseña
            </Label>
            <Link
              href="/auth/forgot-password"
              className="ml-auto text-xs font-medium underline-offset-4 hover:underline"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-ink bg-cream focus-visible:ring-fucsia"
          />
        </div>
        {error && (
          <p className="rounded-md border-2 border-fucsia bg-fucsia/10 px-3 py-2 text-sm text-fucsia">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full bg-fucsia font-bold uppercase tracking-wider text-cream shadow-sticker-sm hover:bg-orange hover:text-ink"
          disabled={isLoading}
        >
          {isLoading ? "Ingresando…" : "Ingresar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Todavía no tenés cuenta?{" "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-fucsia underline-offset-4 hover:underline"
          >
            Creala
          </Link>
        </p>
      </form>
    </div>
  );
}