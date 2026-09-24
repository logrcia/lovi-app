import type { SupabaseClient } from "@supabase/supabase-js";
import { LOVI_MEDIA_BUCKET, PETS_BUCKET, PROFILES_BUCKET } from "./types";

const SIGNED_URL_EXPIRY = 60 * 60; // 1 hora

/** Los buckets son privados (RLS owner-only): todo consumo pasa por URLs firmadas. */
async function signUrl(
  supabase: Pick<SupabaseClient, "storage">,
  bucket: string,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function signPetImage(
  supabase: Pick<SupabaseClient, "storage">,
  path: string | null,
): Promise<string | null> {
  return signUrl(supabase, PETS_BUCKET, path);
}

export async function signLoviMedia(
  supabase: Pick<SupabaseClient, "storage">,
  paths: (string | null)[],
): Promise<(string | null)[]> {
  return Promise.all(
    paths.map((p) => signUrl(supabase, LOVI_MEDIA_BUCKET, p)),
  );
}

export async function signProfileImage(
  supabase: Pick<SupabaseClient, "storage">,
  path: string | null,
): Promise<string | null> {
  return signUrl(supabase, PROFILES_BUCKET, path);
}