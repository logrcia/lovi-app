/**
 * Tipos del dominio social mock de Lovi.
 *
 * MODELO: USUARIO -> SIGUE -> MASCOTA. Nunca se siguen usuarios.
 *
 * Estos tipos son deliberadamente "planos": cuando se reemplacen los mocks
 * por queries reales de Supabase, un `MockLovi` se arma desde una fila de
 * `lovis` + `lovi_media`, y un `MockPet` desde una fila de `pets` + un
 * `count(*)` sobre `pet_follows`. Por eso NO hay `email` en ningun tipo
 * (nunca debe expose), y por eso `followerCount` es un numero ya resuelto
 * en lugar de una relacion.
 *
 * Cuando los datos vengan de Supabase, estos tipos se conservan como la
 * capa de presentacion; solo cambia quien los produce.
 */

export type MediaKind = "image" | "video" | "audio";

/**
 * Un archivo dentro de un Lovi. Un Lovi puede tener 0..N.
 *
 * `url` hoy es un data-URI SVG generado localmente. Cuando enganche el
 * storage real, el mismo campo recibe la signed URL y nada mas cambia:
 * es exactamente el mismo contrato que usa hoy `media_signed_urls`.
 */
export type MockMedia = {
  id: string;
  type: MediaKind;
  url: string;
  alt?: string;
  /** Para video: imagen de portada mientras carga. Mock: el mismo SVG. */
  posterUrl?: string;
};

export type MockLovi = {
  id: string;
  petId: string;
  title: string;
  description: string | null;
  /** ISO 8601. Se ordena de mas reciente a mas antiguo. */
  createdAt: string;
  /** 0..N. Vacio = Lovi puramente textual. */
  media: MockMedia[];
};

export type MockPet = {
  id: string;
  ownerId: string;
  name: string;
  image: string;
  especie: string;
  /** yyyy-mm-dd. */
  birthDate: string;
  /**
   * Edad ya resuelta ("3 años"). Se guarda como string y no se calcula en
   * render: el proyecto usa cacheComponents, que no permite `new Date()`
   * durante el prerender de un Client Component. Es determinista y ademas
   * evita que la edad "envejezca" entre deploys sin querer.
   */
  ageLabel: string;
  description: string;
  /**
   * Seguidores BASE, sin contar al viewer mock actual.
   * El contador real es `followerCount + (isFollowing ? 1 : 0)`.
   * Nunca se muta: el mock es inmutable.
   */
  followerCount: number;
};

export type MockUser = {
  id: string;
  nombre: string;
  avatar: string;
  bio: string | null;
  /** Derivado de pets.ts, no duplicado como fuente de verdad. */
  pets: MockPet[];
};

/**
 * Un Lovi hidratado para el feed: ya resuelto con su mascota y su dueño.
 * Los componentes reciben ESTE tipo, nunca un MockLovi crudo, para no tener
 * que hacer lookups dentro de la vista.
 */
export type FeedLovi = MockLovi & {
  pet: MockPet;
  owner: MockUser;
  /** Seguidores que ve el usuario actual en esta mascota. */
  followerCount: number;
  isFollowing: boolean;
  isOwnPet: boolean;
  /** true cuando el Lovi viene de una mascota que el viewer NO sigue (recomendacion). */
  isRecommendation?: boolean;
};

/** Mascota con el estado social del viewer resuelto. */
export type PetWithSocial = MockPet & {
  owner: MockUser;
  followerCount: number;
  isFollowing: boolean;
  isOwnPet: boolean;
};
