import { ProfileForm } from "@/components/profile-form";
import { getProfile } from "@/lib/queries";
import { signProfileImage } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function ProfilePage() {
  const supabase = await createClient();
  const profile = await getProfile(supabase);

  const signed = profile?.image ? await signProfileImage(supabase, profile.image) : null;

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-8">
        <p className="sticker bg-butter text-ink">tu perfil</p>
        <h1 className="lovi-headline mt-3">Cuenta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu nombre, tu foto y cómo salís de Lovi.
        </p>
      </header>

      <ProfileForm
        nombre={profile?.nombre ?? ""}
        email={profile?.email ?? null}
        previewUrl={signed}
        imagePath={profile?.image ?? null}
      />
    </div>
  );
}