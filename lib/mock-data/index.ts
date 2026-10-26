/**
 * API PUBLICA del prototipo.
 *
 * ESTE ES EL UNICO ARCHIVO que los componentes consumen. Nadie importa de
 * users.ts / pets.ts / lovis.ts directamente. Esa frontera es lo que hace
 * barato el swap a Supabase mas adelante: se reemplazan estas funciones
 * por queries reales y ningun componente cambia.
 *
 * Reglas del modelo, resueltas acá y en ningun otro lado:
 *   - USUARIO -> SIGUE -> MASCOTA. Nunca se siguen usuarios.
 *   - El feed = lovis de mascotas propias + lovis de mascotas seguidas.
 *   - El contador real = followerCount base + (isFollowing ? 1 : 0).
 *   - Una mascota propia nunca muestra Seguir.
 *
 * NOTA: estas funciones son SINCRONAS y puras. Reciben el estado de follows
 * como parametro (un array de petIds) en vez de leerlo solas, para que el
 * unico lugar con estado de follows sea <MockFollowProvider>. Igual criterio
 * para los recuerdos creados en el prototipo: se pasan como `extraLovis`
 * (fuente: <MockCreatedLovisProvider>), nunca se leen desde aca.
 */

import { MOCK_LOVIS } from "./lovis";
import { MOCK_PETS } from "./pets";
import { MOCK_USERS } from "./users";
import {
  getMockAlbum,
  getMockAlbumLoviIds,
  MOCK_ALBUMS,
  type MockAlbum,
} from "./pet-sections";
import type { FeedLovi, MockLovi, MockPet, MockUser, PetWithSocial } from "./types";

/**
 * Usuario mock actual. TODO el prototipo se calcula desde aca:
 * cuales son sus mascotas, que sigue, que Lovis van al Home, y donde
 * aparece Seguir / Siguiendo / "Tu mascota".
 */
export const CURRENT_MOCK_USER_ID = "user-abril";

const USER_SEEDS = MOCK_USERS;

/** Mapa de indices: evita O(n) repetido y mantiene los helpers puros. */
const PET_BY_ID = new Map(MOCK_PETS.map((p) => [p.id, p]));
const LOvis_BY_PET = MOCK_LOVIS.reduce<Map<string, MockLovi[]>>((acc, lovi) => {
  const list = acc.get(lovi.petId) ?? [];
  list.push(lovi);
  acc.set(lovi.petId, list);
  return acc;
}, new Map());

// ---------------------------------------------------------------------------
// Lectura cruda
// ---------------------------------------------------------------------------

/** Todos los usuarios con sus mascotas ya resueltas. */
export function getMockUsers(): MockUser[] {
  return USER_SEEDS.map((u) => ({ ...u, pets: getMockPetsByUser(u.id) }));
}

export function getMockUser(id: string): MockUser | null {
  const seed = USER_SEEDS.find((u) => u.id === id);
  if (!seed) return null;
  return { ...seed, pets: getMockPetsByUser(seed.id) };
}

export function getMockUserByName(nombre: string): MockUser | null {
  const seed = USER_SEEDS.find(
    (u) => u.nombre.toLowerCase() === nombre.trim().toLowerCase(),
  );
  return seed ? getMockUser(seed.id) : null;
}

/** Mascotas crudas (sin estado social). */
export function getMockPet(id: string): MockPet | null {
  return PET_BY_ID.get(id) ?? null;
}

export function getMockPetsByUser(userId: string): MockPet[] {
  return MOCK_PETS.filter((p) => p.ownerId === userId);
}

export function getMockPets(): MockPet[] {
  return [...MOCK_PETS];
}

export function isMockPetOwnedBy(petId: string, userId: string): boolean {
  return PET_BY_ID.get(petId)?.ownerId === userId;
}

// ---------------------------------------------------------------------------
// Estado social (el unico lugar donde se resuelve)
// ---------------------------------------------------------------------------

/**
 * Mascota con el estado del viewer resuelto.
 * @param followedPetIds PetIds que sigue el viewer (fuente: el provider).
 */
export function getMockPetWithSocial(
  petId: string,
  followedPetIds: readonly string[],
): PetWithSocial | null {
  const pet = getMockPet(petId);
  if (!pet) return null;
  const owner = getMockUser(pet.ownerId);
  if (!owner) return null;
  const isFollowing = followedPetIds.includes(pet.id);
  return {
    ...pet,
    owner,
    // El mock guarda la base sin el viewer; el +1 aplica si lo sigue.
    followerCount: pet.followerCount + (isFollowing ? 1 : 0),
    isFollowing,
    isOwnPet: pet.ownerId === CURRENT_MOCK_USER_ID,
  };
}

export function getMockPetsWithSocial(
  followedPetIds: readonly string[],
): PetWithSocial[] {
  return MOCK_PETS.map((p) => getMockPetWithSocial(p.id, followedPetIds)).filter(
    (p): p is PetWithSocial => p !== null,
  );
}

/** Mascotas del usuario actual, con estado social. */
export function getMockOwnPets(followedPetIds: readonly string[]): PetWithSocial[] {
  return getMockPetsWithSocial(followedPetIds).filter((p) => p.isOwnPet);
}

/** Mascotas que sigue el viewer y NO son suyas. */
export function getMockFollowedPets(followedPetIds: readonly string[]): PetWithSocial[] {
  return getMockPetsWithSocial(followedPetIds).filter(
    (p) => !p.isOwnPet && p.isFollowing,
  );
}

/** Mascotas ajenas que el viewer todavia NO sigue (candidatas a Explorar). */
export function getMockDiscoverablePets(followedPetIds: readonly string[]): PetWithSocial[] {
  return getMockPetsWithSocial(followedPetIds)
    .filter((p) => !p.isOwnPet)
    .sort((a, b) => b.followerCount - a.followerCount);
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

/** Un Lovi con mascota y dueño resueltos. */
function hydrateLovi(lovi: MockLovi, followedPetIds: readonly string[]): FeedLovi | null {
  const pet = getMockPetWithSocial(lovi.petId, followedPetIds);
  if (!pet) return null;
  return {
    ...lovi,
    pet,
    owner: pet.owner,
    followerCount: pet.followerCount,
    isFollowing: pet.isFollowing,
    isOwnPet: pet.isOwnPet,
  };
}

/**
 * Feed del Home: lovis de las mascotas propias + lovis de las seguidas,
 * mezclados y ordenados de mas reciente a mas antiguo.
 *
 * Es la unica funcion que aplica la regla de visibilidad del feed: lo que no
 * esta en este Set no se renderiza en Home. El perfil de una mascota NO
 * aplica esta regla (ver getMockPetLovis).
 *
 * @param extraLovis Recuerdos creados en el prototipo (fuente: el provider).
 *   Se mezclan DELANTE de la semilla y pasan por el mismo hydrateLovi; no se
 *   muta MOCK_LOVIS.
 */
export function getMockFeed(
  followedPetIds: readonly string[],
  extraLovis: readonly MockLovi[] = [],
): FeedLovi[] {
  const ownPetIds = new Set(
    getMockOwnPets(followedPetIds).map((p) => p.id),
  );
  const followed = new Set(
    getMockFollowedPets(followedPetIds).map((p) => p.id),
  );
  const visiblePetIds = new Set([...ownPetIds, ...followed]);
  const source: readonly MockLovi[] = [...extraLovis, ...MOCK_LOVIS];

  return source.filter((l) => visiblePetIds.has(l.petId))
    .map((l) => hydrateLovi(l, followedPetIds))
    .filter((l): l is FeedLovi => l !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/**
 * Simula carga progresiva del feed: devuelve solo las primeras `count`.
 * Reemplaza la paginacion real (que usara keyset sobre lovis) mientras
 * validamos la UX del scroll.
 *
 * @param extraLovis Recuerdos creados en el prototipo (ver getMockFeed).
 */
export function getMockFeedPage(
  followedPetIds: readonly string[],
  count: number,
  extraLovis: readonly MockLovi[] = [],
): FeedLovi[] {
  return getMockFeed(followedPetIds, extraLovis).slice(0, count);
}

/**
 * Recomendaciones del Home: lovis de mascotas ajenas que el viewer NO sigue
 * (ni son propias, ni estan seguidas), ordenados de mas reciente a mas antiguo.
 *
 * Cada uno se hidrata como FeedLovi con `isRecommendation: true` para que el
 * componente pueda marcar la tarjeta ("De cuentas que no seguís").
 *
 * No muta MOCK_LOVIS. Los `extraLovis` (creados en el proto) entran en el
 * origen pero, al ser de mascotas propias del viewer, quedan excluidos por la
 * regla de visibilidad.
 *
 * @param followedPetIds PetIds que sigue el viewer (fuente: el provider).
 * @param extraLovis Recuerdos creados en el prototipo (fuente: el provider).
 */
export function getMockRecommendedLovis(
  followedPetIds: readonly string[],
  extraLovis: readonly MockLovi[] = [],
): FeedLovi[] {
  const ownPetIds = new Set(
    getMockOwnPets(followedPetIds).map((p) => p.id),
  );
  const followed = new Set(
    getMockFollowedPets(followedPetIds).map((p) => p.id),
  );
  const excludedPetIds = new Set([...ownPetIds, ...followed]);
  const source: readonly MockLovi[] = [...extraLovis, ...MOCK_LOVIS];

  return source
    .filter((l) => !excludedPetIds.has(l.petId))
    .map((l) => hydrateLovi(l, followedPetIds))
    .filter((l): l is FeedLovi => l !== null)
    .map((l) => ({ ...l, isRecommendation: true }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/**
 * Lovis de una mascota concreta, ordenados de mas reciente a mas antiguo.
 *
 * SIN gating por follow: entrar al perfil de una mascota muestra siempre
 * todos sus recuerdos, estes o no seguidos. Decidido en refinamiento de
 * producto: el follow gobierna el Home, no el perfil.
 *
 * La visibilidad por seguimiento se aplica SOLO en getMockFeed.
 *
 * @param extraLovis Recuerdos creados en el prototipo (fuente: el provider).
 *   Se filtran por petId y se concatenan con la semilla SIN mutar el Map
 *   LOvis_BY_PET (es modulo-level y compartido entre llamadas).
 */
export function getMockPetLovis(
  petId: string,
  followedPetIds: readonly string[],
  extraLovis: readonly MockLovi[] = [],
): FeedLovi[] {
  const merged: readonly MockLovi[] = [
    ...extraLovis.filter((l) => l.petId === petId),
    ...(LOvis_BY_PET.get(petId) ?? []),
  ];
  return merged
    .map((l) => hydrateLovi(l, followedPetIds))
    .filter((l): l is FeedLovi => l !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/** Totales para el perfil humano: cuantas mascotas tiene. */
export function getMockPetCount(userId: string): number {
  return getMockPetsByUser(userId).length;
}

// re-export: la página de detalle valida pertenencia desde la API pública.
export { getMockAlbum };

/**
 * Detalle de un álbum: la semilla del álbum + sus lovis hidratados.
 *
 * La membresía (albumId -> [loviIds]) es ESTÁTICA, igual que MOCK_ALBUMS:
 * los lovis creados en el prototipo no entran a álbumes porque no existe
 * flujo de "agregar al álbum" en el proto. Por eso NO hay parámetro
 * `extraLovis`, a diferencia de getMockPetLovis / getMockFeed.
 *
 * Devuelve null si el álbum no existe o no pertenece a la mascota (el mismo
 * criterio que getMockAlbum, que la página ya chequea con notFound()).
 *
 * Orden: de mas reciente a mas antiguo, mismo criterio que getMockPetLovis.
 *
 * @param followedPetIds Fuente: el provider, igual que el resto de la API.
 */
export function getMockAlbumBundle(
  petId: string,
  albumId: string,
  followedPetIds: readonly string[],
): { album: MockAlbum; lovis: FeedLovi[] } | null {
  const album = getMockAlbum(petId, albumId);
  if (!album) return null;

  const petLovis = LOvis_BY_PET.get(petId) ?? [];
  const byId = new Map(petLovis.map((l) => [l.id, l]));

  const lovis = getMockAlbumLoviIds(albumId)
    .map((id) => byId.get(id))
    .filter((l): l is MockLovi => l !== undefined)
    .map((l) => hydrateLovi(l, followedPetIds))
    .filter((l): l is FeedLovi => l !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return { album, lovis };
}

/**
 * Params de generateStaticParams para /proto/pets/[id]/albums/[albumId]:
 * un entry por álbum de la semilla, ya con la mascota que lo contiene.
 */
export function getMockAlbumParams(): { id: string; albumId: string }[] {
  return MOCK_ALBUMS.map((album) => ({ id: album.petId, albumId: album.id }));
}

/** Seguidores totales de un usuario = suma de los de sus mascotas. */
export function getMockUserFollowerTotal(
  userId: string,
  followedPetIds: readonly string[],
): number {
  return getMockPetsWithSocial(followedPetIds)
    .filter((p) => p.owner.id === userId)
    .reduce((acc, p) => acc + p.followerCount, 0);
}
