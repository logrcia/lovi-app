import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <AuthShell eyebrow="ingresá a tu diario">
      <LoginForm />
    </AuthShell>
  );
}