export type Profile = {
  user_id: string;
  nombre: string;
  email: string;
  image: string | null;
  created_at: string;
};

export type Pet = {
  pet_id: string;
  user_id: string;
  pet_name: string;
  especie: string;
  birth_date: string | null;
  image: string | null;
  description: string | null;
};

export type MediaType = "image" | "video" | "audio";

export type Lovi = {
  lovi_id: string;
  creator_user_id: string;
  pet_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type LoviMedia = {
  media_id: string;
  lovi_id: string;
  media_url: string;
  media_type: MediaType;
  position: number;
};

export type Album = {
  album_id: string;
  pet_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type Vaccine = {
  vac_id: string;
  pet_id: string;
  name: string;
  date: string;
  next_dose: string | null;
};

export type Appointment = {
  ap_id: string;
  pet_id: string;
  name: string;
  date: string;
  description: string | null;
};

// Lovi enriquecido con data de su mascota
export type LoviWithPet = Lovi & {
  pet_name: string;
  pet_image: string | null;
};

export type LoviWithMedia = LoviWithPet & {
  media: LoviMedia[];
  media_signed_urls: (string | null)[];
};

export type AlbumWithCount = Album & { lovis_count: number };

export type CalendarMark = {
  date: string; // yyyy-mm-dd
  kind: "lovi" | "vaccine" | "appointment" | "birthday";
  label: string;
  pet_name: string;
  hero?: boolean;
};

export const PETS_BUCKET = "pets";
export const LOVI_MEDIA_BUCKET = "lovi-media";
export const PROFILES_BUCKET = "profiles";