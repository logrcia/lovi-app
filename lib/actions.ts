"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LOVI_MEDIA_BUCKET, PETS_BUCKET } from "@/lib/types";
import type { MediaType } from "@/lib/types";
import { removeFiles } from "@/lib/storage";

/**
 * Server Actions de mutación para Lovi.
 *
 * Toda la autorización la aplica Supabase RLS (migración 0002/0003):
 * las funciones solo validan entrada y leen el usuario de la sesión;
 * jamás confían en ids enviados por el cliente para decidir propiedad.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

type LoviMediaInput = {
  media_url: string;
  media_type: MediaType;
  position: number;
};

const VALID_MEDIA_TYPES: MediaType[] = ["image", "video", "audio"];

// ---------------------------------------------------------------------------
// Mascotas
// ---------------------------------------------------------------------------

export async function createPet(input: {
  pet_name: string;
  especie: string;
  birth_date: string | null;
  description: string | null;
  image: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const pet_name = input.pet_name.trim();
  const especie = input.especie.trim();
  if (!pet_name || !especie) {
    return { ok: false, error: "Nombre y especie son obligatorios." };
  }

  const { error } = await supabase.from("pets").insert({
    user_id: user.id,
    pet_name,
    especie,
    birth_date: input.birth_date || null,
    description: input.description || null,
    image: input.image || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/pets");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function updatePet(
  petId: string,
  input: {
    pet_name: string;
    especie: string;
    birth_date: string | null;
    description: string | null;
    image: string | null;
  },
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const pet_name = input.pet_name.trim();
  const especie = input.especie.trim();
  if (!pet_name || !especie) {
    return { ok: false, error: "Nombre y especie son obligatorios." };
  }

  // Si se reemplaza la imagen, leer la vía ANTES del update para poder
  // borrar la anterior (best-effort).
  let previousImage: string | null = null;
  if (input.image) {
    const { data: pet } = await supabase
      .from("pets")
      .select("image")
      .eq("pet_id", petId)
      .eq("user_id", user.id)
      .single();
    previousImage = pet?.image ?? null;
  }

  const { error } = await supabase
    .from("pets")
    .update({
      pet_name,
      especie,
      birth_date: input.birth_date || null,
      description: input.description || null,
      image: input.image || null,
    })
    .eq("pet_id", petId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  if (previousImage && previousImage !== input.image) {
    await removeFiles(supabase, PETS_BUCKET, [previousImage]);
  }

  revalidatePath("/");
  revalidatePath("/pets");
  revalidatePath(`/pets/${petId}`);
  revalidatePath("/calendar");
  return { ok: true };
}

export async function deletePet(petId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  // Recuperar rutas de media del pet para limpiar storage BEST-EFFORT
  // (la DB borra en cascada: lovis -> lovi_media, albums, vacunas, turnos).
  const { data: lovis } = await supabase
    .from("lovis")
    .select("lovi_id")
    .eq("pet_id", petId);
  const loviIds = (lovis ?? []).map((l) => l.lovi_id);

  let petImagePath: string | null = null;
  const { data: pet } = await supabase
    .from("pets")
    .select("image")
    .eq("pet_id", petId)
    .single();
  petImagePath = pet?.image ?? null;

  let mediaPaths: string[] = [];
  if (loviIds.length > 0) {
    const { data: media } = await supabase
      .from("lovi_media")
      .select("media_url")
      .in("lovi_id", loviIds);
    mediaPaths = (media ?? []).map((m) => m.media_url);
  }

  const { error } = await supabase
    .from("pets")
    .delete()
    .eq("pet_id", petId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  if (petImagePath) await removeFiles(supabase, PETS_BUCKET, [petImagePath]);
  if (mediaPaths.length > 0) {
    await removeFiles(supabase, LOVI_MEDIA_BUCKET, mediaPaths);
  }

  revalidatePath("/");
  revalidatePath("/pets");
  revalidatePath("/calendar");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Lovis
// ---------------------------------------------------------------------------

export async function createLovi(input: {
  pet_id: string;
  title: string;
  description: string | null;
  media: LoviMediaInput[];
}): Promise<ActionResult & { lovi_id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "El título es obligatorio." };
  if (!input.pet_id) return { ok: false, error: "Elegí una mascota." };
  if (input.media.length === 0) {
    return { ok: false, error: "Subí al menos un archivo para loviar." };
  }
  for (const m of input.media) {
    if (!m.media_url) {
      return { ok: false, error: "Hubo un problema con un archivo." };
    }
    if (!VALID_MEDIA_TYPES.includes(m.media_type)) {
      return { ok: false, error: "Tipo de archivo no válido." };
    }
  }

  // Insertar el lovi; RLS exige que la mascota sea propia.
  const { data: lovi, error: loviError } = await supabase
    .from("lovis")
    .insert({
      creator_user_id: user.id,
      pet_id: input.pet_id,
      title,
      description: input.description || null,
    })
    .select("lovi_id")
    .single();
  if (loviError || !lovi) {
    return { ok: false, error: loviError?.message ?? "No se pudo loviar." };
  }

  // Insertar el media; RLS valida contra la mascota del lovi creado.
  const { error: mediaError } = await supabase.from("lovi_media").insert(
    input.media.map((m) => ({
      lovi_id: lovi.lovi_id,
      media_url: m.media_url,
      media_type: m.media_type,
      position: m.position,
    })),
  );
  if (mediaError) {
    // Rollback del lovi (y los archivos subidos quedan huérfanos, se
    // limpian en una tarea futura; el usuario puede reintentar).
    await supabase.from("lovis").delete().eq("lovi_id", lovi.lovi_id);
    return { ok: false, error: mediaError.message };
  }

  revalidatePath("/");
  revalidatePath(`/pets/${input.pet_id}`);
  revalidatePath(`/pets/${input.pet_id}/memories`);
  revalidatePath("/calendar");
  return { ok: true, lovi_id: lovi.lovi_id };
}

export async function deleteLovi(loviId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  // Recuperar el pet_id ANTES del delete para revalidar /pets/<id>/memories.
  // Nota: lovi_media NO tiene pet_id (va por FK al lovi), así que se lee del
  // propio lovi; RLS (lovis_select_own_pet) lo permite igual que el delete.
  const { data: lovi } = await supabase
    .from("lovis")
    .select("pet_id")
    .eq("lovi_id", loviId)
    .single();
  const petId = lovi?.pet_id ?? "";

  const { data: media } = await supabase
    .from("lovi_media")
    .select("media_url")
    .eq("lovi_id", loviId);
  const mediaPaths = (media ?? []).map((m) => m.media_url);

  const { error } = await supabase
    .from("lovis")
    .delete()
    .eq("lovi_id", loviId);
  if (error) return { ok: false, error: error.message };

  if (mediaPaths.length > 0) {
    await removeFiles(supabase, LOVI_MEDIA_BUCKET, mediaPaths);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  // Solo si se encontró el lovi (y por lo tanto su mascota) existe la ruta.
  if (petId) revalidatePath(`/pets/${petId}/memories`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Álbumes
// ---------------------------------------------------------------------------

export async function createAlbum(input: {
  pet_id: string;
  title: string;
  description: string | null;
}): Promise<ActionResult & { album_id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "El título del álbum es obligatorio." };

  const { data: album, error } = await supabase
    .from("albums")
    .insert({
      pet_id: input.pet_id,
      title,
      description: input.description || null,
    })
    .select("album_id")
    .single();
  if (error || !album) {
    return { ok: false, error: error?.message ?? "No se pudo crear el álbum." };
  }

  revalidatePath(`/pets/${input.pet_id}/albums`);
  return { ok: true, album_id: album.album_id };
}

export async function deleteAlbum(
  petId: string,
  albumId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("albums")
    .delete()
    .eq("album_id", albumId)
    .eq("pet_id", petId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/albums`);
  return { ok: true };
}

export async function addLoviToAlbum(
  petId: string,
  albumId: string,
  loviId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase.from("album_lovis").insert({
    album_id: albumId,
    lovi_id: loviId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/albums/${albumId}`);
  return { ok: true };
}

export async function removeLoviFromAlbum(
  petId: string,
  albumId: string,
  loviId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("album_lovis")
    .delete()
    .eq("album_id", albumId)
    .eq("lovi_id", loviId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/albums/${albumId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Vacunas
// ---------------------------------------------------------------------------

export async function createVaccine(input: {
  pet_id: string;
  name: string;
  date: string;
  next_dose: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const name = input.name.trim();
  if (!name || !input.date) {
    return { ok: false, error: "Nombre y fecha son obligatorios." };
  }

  const { error } = await supabase.from("vaccines").insert({
    pet_id: input.pet_id,
    name,
    date: input.date,
    next_dose: input.next_dose || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${input.pet_id}/vaccines`);
  revalidatePath("/calendar");
  return { ok: true };
}

export async function deleteVaccine(
  petId: string,
  vacId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("vaccines")
    .delete()
    .eq("vac_id", vacId)
    .eq("pet_id", petId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/vaccines`);
  revalidatePath("/calendar");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Turnos
// ---------------------------------------------------------------------------

export async function createAppointment(input: {
  pet_id: string;
  name: string;
  date: string;
  description: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const name = input.name.trim();
  if (!name || !input.date) {
    return { ok: false, error: "Nombre y fecha son obligatorios." };
  }

  const { error } = await supabase.from("appointments").insert({
    pet_id: input.pet_id,
    name,
    date: input.date,
    description: input.description || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${input.pet_id}/appointments`);
  revalidatePath("/calendar");
  return { ok: true };
}

export async function deleteAppointment(
  petId: string,
  apId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("ap_id", apId)
    .eq("pet_id", petId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pets/${petId}/appointments`);
  revalidatePath("/calendar");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

export async function updateProfile(input: {
  nombre: string;
  image: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };

  // RLS exige user_id = auth.uid(); el email queda intacto (unicidad).
  const { error } = await supabase
    .from("profiles")
    .update({ nombre, image: input.image || null })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/profile");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Social: follows
// ---------------------------------------------------------------------------

/**
 * Seguir / dejar de seguir a un usuario. La autorización la decide RLS
 * (migración 0004): solo se inserta/borra la fila donde YO soy el follower.
 * Nunca se expone el email ni el perfil completo del objetivo.
 *
 * Devuelve void porque se consume como server action vía `bind` en un form
 * de server component (el resultado no alimenta UI de error).
 */
export async function toggleFollow(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (!targetUserId) return;
  if (targetUserId === user.id) {
    return;
  }

  // RLS (0004) permite SELECCIONAR solo conexiones propias: la fila
  // consultada siempre es nuestra (follower_user_id = auth.uid()).
  const { data: existing } = await supabase
    .from("follows")
    .select("follower_user_id")
    .eq("follower_user_id", user.id)
    .eq("following_user_id", targetUserId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_user_id", user.id)
      .eq("following_user_id", targetUserId);
    if (error) return;
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_user_id: user.id, following_user_id: targetUserId });
    if (error) return;
  }

  revalidatePath("/");
  revalidatePath("/users");
  revalidatePath(`/users/${targetUserId}`);
}