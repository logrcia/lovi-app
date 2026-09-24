import Link from "next/link";

import { PetImage } from "@/components/pet-image";
import { ProfileEdit } from "@/components/profile-edit";
import { formatLongDate } from "@/lib/format";
import { signProfileImage } from "@/lib/media";
import { getFollowCounts, getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function ProfilePage() {
  const supabase = await createClient();
  const profile = await getProfile(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = profile?.user_id ?? user?.id ?? "";

  const signed = profile?.image ? await signProfileImage(supabase, profile.image) : null;

  const counts = userId
    ? await getFollowCounts(supabase, userId)
    : { followers_count: 0, following_count: 0 };

  return (
    <div className="mx-auto max-w-lg">
      <header className="mb-8">
        <p className="sticker bg-butter text-ink">tu perfil</p>
        <h1 className="lovi-headline mt-3">Mi perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu nombre, tu foto, tus seguidores y cómo salís de Lovi.
        </p>
      </header>

      {profile ? (
        <section className="card-lovi mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <PetImage
            name={profile.nombre}
            src={signed}
            className="h-28 w-28 shrink-0 rounded-full"
            imgClassName="h-full w-full rounded-full"
            tone="bg-orange"
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {profile.nombre}
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
              Miembro desde {formatLongDate(profile.created_at)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-ink">
              <Link
                href={`/users/${profile.user_id}?tab=seguidores`}
                className="transition-colors hover:text-fucsia"
              >
                {counts.followers_count}{" "}
                {counts.followers_count === 1 ? "seguidor" : "seguidores"}
              </Link>
              <span className="text-ink/40">·</span>
              <Link
                href={`/users/${profile.user_id}?tab=siguiendo`}
                className="transition-colors hover:text-fucsia"
              >
                {counts.following_count} siguiendo
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <ProfileEdit
        nombre={profile?.nombre ?? ""}
        email={profile?.email ?? null}
        previewUrl={signed}
        imagePath={profile?.image ?? null}
      />
    </div>
  );
}