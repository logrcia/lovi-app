/**
 * Estado de "seguir" del prototipo: SOLO frontend.
 *
 * Unica fuente de verdad: el Set de petIds que sigue el viewer mock actual.
 * Persiste en localStorage con la clave LOVI_MOCK_FOLLOWS.
 *
 * Por que Context y no useSyncExternalStore: esta fase valida UX, no
 * arquitectura. Un Provider + useState es el patron mas simple que
 * cumple los tres requisitos (fuente unica, persistencia, sin hydration
 * mismatch) y no agrega una capa de indireccion.
 *
 * Cuando se conecte Supabase, este archivo se reemplaza por
 * togglePetFollow(petId) + una query de pet_follows. El resto de la UI no
 * cambia porque todos consumen las funciones de index.ts.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CURRENT_MOCK_USER_ID, isMockPetOwnedBy } from "./index";

const STORAGE_KEY = "LOVI_MOCK_FOLLOWS";

/**
 * Follows iniciales. Se eligieron para que el feed arranque con contenido
 * de otras personas mezclado con el propio, y para que haya mascotas
 * propias (que nunca muestran Seguir) y ajenas sin seguir (que muestran
 * Seguir) desde el primer render.
 */
const INITIAL_FOLLOWS: string[] = [
  "pet-mora", // de Lola
  "pet-nina", // de Sol
  "pet-roco", // de Sol
];

type FollowContextValue = {
  /** PetIds que sigue el viewer. Fuente unica. */
  followedPetIds: string[];
  isFollowing: (petId: string) => boolean;
  toggleFollow: (petId: string) => void;
  /** Id del viewer mock actual. */
  viewerId: string;
  /** Esa mascota es del viewer: no se puede seguir. */
  isOwnPet: (petId: string) => boolean;
  /** true una vez que se leyeron localStorage (evita mismatch de hidratacion). */
  ready: boolean;
};

const FollowContext = createContext<FollowContextValue | null>(null);

function readStored(): string[] {
  if (typeof window === "undefined") return INITIAL_FOLLOWS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_FOLLOWS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_FOLLOWS;
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return INITIAL_FOLLOWS;
  }
}

export function MockFollowProvider({ children }: { children: React.ReactNode }) {
  // El estado inicial es SIEMPRE el mismo en servidor y cliente. El valor
  // guardado se aplica recien despues de montar, asi React no compara HTML
  // distinto para el mismo render.
  const [followedPetIds, setFollowedPetIds] = useState<string[]>(INITIAL_FOLLOWS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFollowedPetIds(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(followedPetIds));
    } catch {
      // Modo privado o cuota llena: la sesion sigue funcionando en memoria.
    }
  }, [followedPetIds, ready]);

  const isFollowing = useCallback(
    (petId: string) => followedPetIds.includes(petId),
    [followedPetIds],
  );

  const toggleFollow = useCallback((petId: string) => {
    // Regla de negocio: no se sigue la propia mascota. Se valida aca para
    // que ningun camino de la UI pueda saltarselo.
    if (isMockPetOwnedBy(petId, CURRENT_MOCK_USER_ID)) return;
    setFollowedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId],
    );
  }, []);

  const isOwnPet = useCallback(
    (petId: string) => isMockPetOwnedBy(petId, CURRENT_MOCK_USER_ID),
    [],
  );

  const value = useMemo<FollowContextValue>(
    () => ({
      followedPetIds,
      isFollowing,
      toggleFollow,
      viewerId: CURRENT_MOCK_USER_ID,
      isOwnPet,
      ready,
    }),
    [followedPetIds, isFollowing, toggleFollow, isOwnPet, ready],
  );

  return <FollowContext.Provider value={value}>{children}</FollowContext.Provider>;
}

export function useMockFollows(): FollowContextValue {
  const ctx = useContext(FollowContext);
  if (!ctx) {
    throw new Error("useMockFollows debe usarse dentro de <MockFollowProvider>");
  }
  return ctx;
}
