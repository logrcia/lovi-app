import { createClient as createServerClient } from "@/lib/supabase/server";
import { signLoviMedia, signPetImage, signProfileImage } from "./media";
import { dateKey } from "./format";
import type {
  Album,
  AlbumWithCount,
  Appointment,
  CalendarMark,
  Lovi,
  LoviMedia,
  LoviWithMedia,
  Pet,
  Profile,
  Vaccine,
} from "./types";

export type AuthSupabase = Awaited<ReturnType<typeof createServerClient>>;

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------
export async function getProfile(supabase: AuthSupabase): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, nombre, email, image, created_at")
    .single();
  if (error || !data) return null;
  return data as Profile;
}

// ---------------------------------------------------------------------------
// Mascotas
// ---------------------------------------------------------------------------
export async function getPets(supabase: AuthSupabase): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("pet_id, user_id, pet_name, especie, birth_date, image, description")
    .order("pet_name", { ascending: true });
  if (error || !data) return [];

  const pets = data as Pet[];
  // image guarda el path de storage: firmar para poder renderizarla.
  return Promise.all(
    pets.map(async (p) => ({ ...p, image: await signPetImage(supabase, p.image) })),
  );
}

export async function getPet(supabase: AuthSupabase, petId: string): Promise<Pet | null> {
  const { data, error } = await supabase
    .from("pets")
    .select("pet_id, user_id, pet_name, especie, birth_date, image, description")
    .eq("pet_id", petId)
    .single();
  if (error || !data) return null;
  const pet = data as Pet;
  return { ...pet, image: await signPetImage(supabase, pet.image) };
}

/**
 * Variante para formularios de edición: devuelve el path crudo (no firmado)
 * en `image`, porque es lo que hay que persistir de vuelta en la DB.
 */
export async function getPetForEdit(
  supabase: AuthSupabase,
  petId: string,
): Promise<Pet | null> {
  const { data, error } = await supabase
    .from("pets")
    .select("pet_id, user_id, pet_name, especie, birth_date, image, description")
    .eq("pet_id", petId)
    .single();
  if (error || !data) return null;
  return data as Pet;
}

// ---------------------------------------------------------------------------
// Lovis (feed + por mascota)
// ---------------------------------------------------------------------------
async function attachMedia(
  supabase: AuthSupabase,
  loviRows: (Lovi & { pets: { pet_name: string; image: string | null }[] })[],
): Promise<LoviWithMedia[]> {
  if (loviRows.length === 0) return [];

  const loviIds = loviRows.map((l) => l.lovi_id);
  const { data: mediaRows } = await supabase
    .from("lovi_media")
    .select("media_id, lovi_id, media_url, media_type, position")
    .in("lovi_id", loviIds)
    .order("position", { ascending: true });

  const mediaByLovi = new Map<string, LoviMedia[]>();
  for (const m of (mediaRows ?? []) as LoviMedia[]) {
    const list = mediaByLovi.get(m.lovi_id) ?? [];
    list.push(m);
    mediaByLovi.set(m.lovi_id, list);
  }

  const withMedia: (Omit<LoviWithMedia, "media_signed_urls" | "pet_image"> & {
    media_paths: (string | null)[];
    pet_image_path: string | null;
  })[] = loviRows.map((l) => {
    const pet = l.pets?.[0];
    const media = mediaByLovi.get(l.lovi_id) ?? [];
    return {
      lovi_id: l.lovi_id,
      creator_user_id: l.creator_user_id,
      pet_id: l.pet_id,
      title: l.title,
      description: l.description,
      created_at: l.created_at,
      pet_name: pet?.pet_name ?? "Mascota",
      pet_image_path: pet?.image ?? null,
      media,
      media_paths: media.map((m) => m.media_url),
    };
  });

  const signed = await Promise.all(
    withMedia.map(async (row) => ({
      media: await signLoviMedia(supabase, row.media_paths),
      pet: await signPetImage(supabase, row.pet_image_path),
    })),
  );
  const signedAll = signed.map((s) => s.media);
  const signedPetImages = signed.map((s) => s.pet);

  return withMedia.map((row, i) => ({
    lovi_id: row.lovi_id,
    creator_user_id: row.creator_user_id,
    pet_id: row.pet_id,
    title: row.title,
    description: row.description,
    created_at: row.created_at,
    pet_name: row.pet_name,
    pet_image: signedPetImages[i],
    media: row.media,
    media_signed_urls: signedAll[i],
  }));
}

async function fetchLovis(
  supabase: AuthSupabase,
  filter?: { pet_id?: string; creator_user_id?: string },
): Promise<LoviWithMedia[]> {
  let query = supabase
    .from("lovis")
    .select(
      "lovi_id, creator_user_id, pet_id, title, description, created_at, pets(pet_name, image)",
    )
    .order("created_at", { ascending: false });
  if (filter?.pet_id) {
    query = query.eq("pet_id", filter.pet_id);
  }
  if (filter?.creator_user_id) {
    query = query.eq("creator_user_id", filter.creator_user_id);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return attachMedia(
    supabase,
    data as (Lovi & { pets: { pet_name: string; image: string | null }[] })[],
  );
}

export function getLovisFeed(supabase: AuthSupabase): Promise<LoviWithMedia[]> {
  return fetchLovis(supabase);
}

export function getPetLovis(supabase: AuthSupabase, petId: string): Promise<LoviWithMedia[]> {
  return fetchLovis(supabase, { pet_id: petId });
}

/** Lovis visibles de un usuario (RLS decide: propios o de seguidos). */
export function getUserLovis(
  supabase: AuthSupabase,
  userId: string,
): Promise<LoviWithMedia[]> {
  return fetchLovis(supabase, { creator_user_id: userId });
}

/**
 * Mascotas VISIBLES de un usuario (RLS: propias o de seguidos).
 * La firma de cada imagen la resuelve el storage policy de 0004
 * (carpetas de seguidos + propias).
 */
export async function getUserPets(supabase: AuthSupabase, userId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("pet_id, user_id, pet_name, especie, birth_date, image, description")
    .eq("user_id", userId)
    .order("pet_name", { ascending: true });
  if (error || !data) return [];

  const pets = data as Pet[];
  return Promise.all(
    pets.map(async (p) => ({ ...p, image: await signPetImage(supabase, p.image) })),
  );
}

// ---------------------------------------------------------------------------
// Álbumes
// ---------------------------------------------------------------------------
export async function getAlbumsWithCount(
  supabase: AuthSupabase,
  petId: string,
): Promise<AlbumWithCount[]> {
  const { data, error } = await supabase
    .from("albums")
    .select("album_id, pet_id, title, description, created_at")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  // counts por album
  const albumIds = (data as Album[]).map((a) => a.album_id);
  if (albumIds.length === 0) return [];

  const { data: counts } = await supabase
    .from("album_lovis")
    .select("album_id")
    .in("album_id", albumIds);

  const byAlbum = new Map<string, number>();
  for (const c of (counts ?? []) as { album_id: string }[]) {
    byAlbum.set(c.album_id, (byAlbum.get(c.album_id) ?? 0) + 1);
  }

  return (data as Album[]).map((a) => ({
    ...a,
    lovis_count: byAlbum.get(a.album_id) ?? 0,
  }));
}

export async function getAlbum(
  supabase: AuthSupabase,
  petId: string,
  albumId: string,
): Promise<{ album: Album; lovis: LoviWithMedia[] } | null> {
  const { data: album, error } = await supabase
    .from("albums")
    .select("album_id, pet_id, title, description, created_at")
    .eq("album_id", albumId)
    .eq("pet_id", petId)
    .single();
  if (error || !album) return null;

  const { data: rows } = await supabase
    .from("album_lovis")
    .select("lovis(lovi_id, creator_user_id, pet_id, title, description, created_at, pets(pet_name, image))")
    .eq("album_id", albumId);

  const loviRows = ((rows ?? []) as { lovis: (Lovi & { pets: { pet_name: string; image: string | null }[] })[] }[])
    .flatMap((r) => r.lovis);

  const lovis = await attachMedia(supabase, loviRows);
  lovis.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { album: album as Album, lovis };
}

// ---------------------------------------------------------------------------
// Vacunas y turnos
// ---------------------------------------------------------------------------
export async function getVaccines(supabase: AuthSupabase, petId: string): Promise<Vaccine[]> {
  const { data, error } = await supabase
    .from("vaccines")
    .select("vac_id, pet_id, name, date, next_dose")
    .eq("pet_id", petId)
    .order("date", { ascending: false });
  if (error || !data) return [];
  return data as Vaccine[];
}

export async function getAppointments(
  supabase: AuthSupabase,
  petId: string,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("ap_id, pet_id, name, date, description")
    .eq("pet_id", petId)
    .order("date", { ascending: false });
  if (error || !data) return [];
  return data as Appointment[];
}

// ---------------------------------------------------------------------------
// Calendario / journal
// ---------------------------------------------------------------------------
export async function getMonthCalendarMarks(
  supabase: AuthSupabase,
  year: number,
  month0: number,
): Promise<CalendarMark[]> {
  // Decisión de producto: el calendario es PRIVADO. Aunque el feed muestre
  // contenido de seguidos (RLS 0004), acá se filtra explícitamente por
  // ownership para que nunca aparezcan lovis ni mascotas de otras personas.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const start = new Date(year, month0, 1);
  const end = new Date(year, month0 + 1, 0);
  const fromKey = dateKey(start.toISOString());
  const toKey = dateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString());
  const marks: CalendarMark[] = [];

  const [
    { data: loviRows },
    { data: vaccineRows },
    { data: appointmentRows },
    { data: petRows },
  ] = await Promise.all([
    supabase
      .from("lovis")
      .select("lovi_id, title, created_at, pets(pet_name)")
      .eq("creator_user_id", user.id)
      .gte("created_at", `${fromKey}T00:00:00`)
      .lte("created_at", `${toKey}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("vaccines")
      .select("vac_id, name, date, pets(pet_name)")
      .gte("date", fromKey)
      .lte("date", toKey),
    supabase
      .from("appointments")
      .select("ap_id, name, date, pets(pet_name)")
      .gte("date", `${fromKey}T00:00:00`)
      .lte("date", `${toKey}`),
    supabase.from("pets").select("pet_id, pet_name, birth_date").eq("user_id", user.id),
  ]);
  for (const l of (loviRows ?? []) as { title: string; created_at: string; pets: { pet_name: string }[] }[]) {
    marks.push({
      date: dateKey(l.created_at),
      kind: "lovi",
      label: l.title,
      pet_name: l.pets?.[0]?.pet_name ?? "Mascota",
      hero: true,
    });
  }

  for (const v of (vaccineRows ?? []) as { name: string; date: string; pets: { pet_name: string }[] }[]) {
    marks.push({
      date: dateKey(v.date),
      kind: "vaccine",
      label: v.name,
      pet_name: v.pets?.[0]?.pet_name ?? "Mascota",
    });
  }

  for (const a of (appointmentRows ?? []) as { name: string; date: string; pets: { pet_name: string }[] }[]) {
    marks.push({
      date: dateKey(a.date),
      kind: "appointment",
      label: a.name,
      pet_name: a.pets?.[0]?.pet_name ?? "Mascota",
    });
  }

  // Cumpleaños: los pets del usuario con birth_date en este mes
  for (const p of (petRows ?? []) as { pet_name: string; birth_date: string | null }[]) {
    if (!p.birth_date) continue;
    const b = dateKey(p.birth_date);
    const bMonth = parseInt(b.slice(5, 7), 10) - 1;
    if (bMonth === month0) {
      marks.push({
        date: b,
        kind: "birthday",
        label: `Cumpleaños de ${p.pet_name}`,
        pet_name: p.pet_name,
      });
    }
  }

  return marks;
}

export async function getDayLovis(supabase: AuthSupabase, key: string): Promise<LoviWithMedia[]> {
  // Calendario privado: solo lovis propios (ver getMonthCalendarMarks).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const rows = await fetchLovis(supabase, { creator_user_id: user.id });
  return rows.filter((l) => dateKey(l.created_at) === key);
}

export async function getDayVaccines(
  supabase: AuthSupabase,
  key: string,
): Promise<(Vaccine & { pet_name: string })[]> {
  const { data, error } = await supabase
    .from("vaccines")
    .select("vac_id, pet_id, name, date, next_dose, pets(pet_name)")
    .eq("date", key);
  if (error || !data) return [];
  return (data as (Vaccine & { pets: { pet_name: string }[] })[]).map((v) => {
    const { pets, ...rest } = v as typeof v & { pets: { pet_name: string }[] };
    return { ...rest, pet_name: pets?.[0]?.pet_name ?? "Mascota" };
  });
}

export async function getDayAppointments(
  supabase: AuthSupabase,
  key: string,
): Promise<(Appointment & { pet_name: string })[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("ap_id, pet_id, name, date, description, pets(pet_name)")
    .gte("date", `${key}T00:00:00`)
    .lte("date", `${key}T23:59:59`);
  if (error || !data) return [];
  return (data as (Appointment & { pets: { pet_name: string }[] })[]).map((a) => {
    const { pets, ...rest } = a as typeof a & { pets: { pet_name: string }[] };
    return { ...rest, pet_name: pets?.[0]?.pet_name ?? "Mascota" };
  });
}

export type DayBirthdays = { pet_id: string; pet_name: string }[];

export async function getDayBirthdays(supabase: AuthSupabase, key: string): Promise<DayBirthdays> {
  // Calendario privado: solo cumpleaños de mascotas propias.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("pets")
    .select("pet_id, pet_name, birth_date")
    .eq("user_id", user.id);
  if (error || !data) return [];
  const monthDay = key.slice(5);
  return (data as { pet_id: string; pet_name: string; birth_date: string | null }[])
    .filter((p) => p.birth_date && dateKey(p.birth_date).slice(5) === monthDay)
    .map((p) => ({ pet_id: p.pet_id, pet_name: p.pet_name }));
}

export async function signPetImageOrNull(
  supabase: AuthSupabase,
  path: string | null,
): Promise<string | null> {
  return signPetImage(supabase, path);
}

// ---------------------------------------------------------------------------
// Social: perfiles públicos, búsqueda y follows
// (RLS + funciones SECURITY DEFINER de la migración 0004; allowlist exacta
// user_id/nombre/image/created_at — NUNCA email, NUNCA profiles directo)
// ---------------------------------------------------------------------------

/** Perfil público de un usuario (imagen ya firmada para render). */
export type PublicProfile = {
  user_id: string;
  nombre: string;
  image: string | null;
  created_at: string;
};

export type FollowCounts = {
  followers_count: number;
  following_count: number;
};

export type FollowListEntry = {
  user_id: string;
  nombre: string;
  image: string | null; // URL firmada del avatar
  is_following: boolean; // ¿el viewer sigue a esta persona?
};

export async function getPublicProfile(
  supabase: AuthSupabase,
  userId: string,
): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .rpc("get_public_profile", { p_user_id: userId })
    .maybeSingle();
  if (error || !data) return null;
  const row = data as PublicProfile;
  return { ...row, image: await signProfileImage(supabase, row.image) };
}

export async function getPublicProfiles(
  supabase: AuthSupabase,
  userIds: string[],
): Promise<PublicProfile[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.rpc("get_public_profiles", {
    p_user_ids: userIds,
  });
  if (error || !data) return [];
  const rows = data as PublicProfile[];
  return Promise.all(
    rows.map(async (r) => ({ ...r, image: await signProfileImage(supabase, r.image) })),
  );
}

export async function searchPublicUsers(
  supabase: AuthSupabase,
  query: string,
): Promise<PublicProfile[]> {
  const { data, error } = await supabase.rpc("search_public_users", {
    p_query: query.trim(),
  });
  if (error || !data) return [];
  const rows = data as PublicProfile[];
  return Promise.all(
    rows.map(async (r) => ({ ...r, image: await signProfileImage(supabase, r.image) })),
  );
}

export async function getFollowCounts(
  supabase: AuthSupabase,
  userId: string,
): Promise<FollowCounts> {
  const { data, error } = await supabase
    .rpc("get_follow_counts", { p_user_id: userId })
    .maybeSingle();
  if (error || !data) return { followers_count: 0, following_count: 0 };
  return data as FollowCounts;
}

export async function getFollowList(
  supabase: AuthSupabase,
  userId: string,
  direction: "followers" | "following",
): Promise<FollowListEntry[]> {
  const { data, error } = await supabase.rpc("get_follow_list", {
    p_user_id: userId,
    p_direction: direction,
  });
  if (error || !data) return [];
  const rows = data as FollowListEntry[];
  return Promise.all(
    rows.map(async (r) => ({ ...r, image: await signProfileImage(supabase, r.image) })),
  );
}

/** Set de following_user_id del usuario (estado de los botones Seguir). */
export async function getFollowTargets(
  supabase: AuthSupabase,
  userId: string,
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from("follows")
    .select("following_user_id")
    .eq("follower_user_id", userId);
  if (error || !data) return new Set();
  return new Set((data as { following_user_id: string }[]).map((r) => r.following_user_id));
}