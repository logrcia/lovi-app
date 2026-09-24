import type { SupabaseClient } from "@supabase/supabase-js";
import { LOVI_MEDIA_BUCKET, PETS_BUCKET, PROFILES_BUCKET } from "./types";
import type { MediaType } from "./types";

/**
 * Subida de archivos a Supabase Storage.
 *
 * Los buckets son privados y las políticas (migración 0003) exigen que el
 * archivo viva en la carpeta del usuario autenticado:
 *   pets/{user_id}/...
 *   lovi-media/{user_id}/...
 *   profiles/{user_id}/...
 * El CLIENTE arma esa carpeta con el id del usuario logueado; el servidor
 * nunca recibe el archivo (RLS + URLs firmadas validan el acceso).
 */

export type StorageClient = Pick<SupabaseClient, "storage">;

export type UploadResult =
  | { ok: true; path: string; mediaType?: MediaType }
  | { ok: false; error: string };

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/webm": ".weba",
  "application/ogg": ".ogg",
};

const MEDIA_TYPE_BY_MIME: Record<string, MediaType> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "image/avif": "image",
  "image/heic": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "audio/mp4": "audio",
  "audio/webm": "audio",
  "application/ogg": "audio",
};

function newObjectName(userId: string, mime: string): string {
  const ext = EXT_BY_MIME[mime] ?? ".bin";
  const id = crypto.randomUUID();
  return `${userId}/${id}${ext}`;
}

export function mediaTypeOf(mime: string): MediaType | null {
  return MEDIA_TYPE_BY_MIME[mime] ?? null;
}

async function uploadOne(
  client: StorageClient,
  bucket: string,
  userId: string,
  file: File,
): Promise<UploadResult> {
  const path = newObjectName(userId, file.type);
  const { error } = await client.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path };
}

/** Sube la foto de una mascota al bucket `pets`. Solo imágenes. */
export async function uploadPetImage(
  client: StorageClient,
  userId: string,
  file: File,
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "La foto de la mascota debe ser una imagen." };
  }
  return uploadOne(client, PETS_BUCKET, userId, file);
}

/** Sube un archivo multimedia de un Lovi (imagen, video o audio). */
export async function uploadLoviMedia(
  client: StorageClient,
  userId: string,
  file: File,
): Promise<UploadResult> {
  const mediaType = mediaTypeOf(file.type);
  if (!mediaType) {
    return {
      ok: false,
      error: "Formato no soportado: usá imagen, video o audio.",
    };
  }
  const res = await uploadOne(client, LOVI_MEDIA_BUCKET, userId, file);
  if (!res.ok) return res;
  return { ok: true, path: res.path, mediaType };
}

/** Sube la imagen de perfil del usuario al bucket `profiles`. */
export async function uploadProfileImage(
  client: StorageClient,
  userId: string,
  file: File,
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "La imagen de perfil debe ser una imagen." };
  }
  return uploadOne(client, PROFILES_BUCKET, userId, file);
}

/** Borra archivos existentes del bucket (path exactos devueltos por la DB). */
export async function removeFiles(
  client: StorageClient,
  bucket: string,
  paths: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (paths.length === 0) return { ok: true };
  const { error } = await client.storage.from(bucket).remove(paths);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}