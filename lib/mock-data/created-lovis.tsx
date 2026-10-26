/**
 * Recuerdos creados en el prototipo: SOLO frontend.
 *
 * Unica fuente de verdad: la lista de MockLovi que el viewer mock creo en
 * esta sesion (y que sobreviven a los reloads via localStorage, clave
 * LOVI_MOCK_CREATED_LOVIS).
 *
 * Replica el patron de follows.tsx a proposito: Context + useState, estado
 * inicial idéntico en servidor y cliente ([]), lectura de localStorage en
 * un useEffect con flag `ready` para evitar hydration mismatch, y escritura
 * en otro efecto tambien gated por `ready`.
 *
 * Los Lovis creados NO se esconden en este archivo: las funciones de
 * index.ts (getMockFeed / getMockPetLovis) los reciben como PARÁMETRO
 * extraLovis, igual que los follows. Eso mantiene index.ts como unica
 * API publica y los datos como estado pasado por parametro.
 *
 * Cuando se conecte Supabase, este archivo se reemplaza por
 * createLovi(...) + una query de invalidacion. El resto de la UI no cambia
 * porque todos consumen las funciones de index.ts.
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

import { mediaImage } from "./assets";
import type { MediaKind, MockLovi, MockMedia } from "./types";

const STORAGE_KEY = "LOVI_MOCK_CREATED_LOVIS";

/** Input de addLovi: lo que el formulario realmente sabe capturar. */
export type CreateLoviInput = {
  petId: string;
  title: string;
  description: string | null;
  mediaKind: MediaKind | null;
};

type CreatedLovisContextValue = {
  /** Lovis creados por el viewer. Fuente unica. */
  createdLovis: MockLovi[];
  /** Crea un Lovi nuevo con placeholder de medio segun el tipo elegido. */
  addLovi: (input: CreateLoviInput) => void;
  /** true una vez que se leyeron localStorage (evita mismatch de hidratacion). */
  ready: boolean;
};

const CreatedLovisContext = createContext<CreatedLovisContextValue | null>(null);

/** Lee localStorage. Fuera del browser (prerender) devuelve la lista vacia. */
function readStored(): MockLovi[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filtramos por forma minima: un dato corrupto no tumba la UI entera.
    return parsed.filter(
      (v): v is MockLovi =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as MockLovi).id === "string" &&
        typeof (v as MockLovi).petId === "string" &&
        typeof (v as MockLovi).title === "string",
    );
  } catch {
    return [];
  }
}

/**
 * Construye el medio placeholder segun el tipo elegido en el formulario.
 * Mismas convenciones que los helpers `video()` / `audio()` de lovis.ts:
 * un SVG local que representa la escena, nunca media real.
 */
function buildMedia(id: string, title: string, kind: MediaKind | null): MockMedia[] {
  // Solo texto: sin bloque de media (caso ya cubierto por el mock semilla).
  if (kind === null) return [];

  if (kind === "image") {
    return [
      {
        id: `${id}-m1`,
        type: "image",
        url: mediaImage(`${id}-img`, 800, 600),
        alt: title,
      },
    ];
  }

  if (kind === "video") {
    // Poster SVG local: sirve de portada hasta que exista asset real.
    const poster = mediaImage(`${id}-poster`, 800, 600, "navy");
    return [
      { id: `${id}-m1`, type: "video", url: poster, posterUrl: poster, alt: title },
    ];
  }

  // audio
  return [
    {
      id: `${id}-m1`,
      type: "audio",
      url: mediaImage(`${id}-audio`, 800, 320, "butter"),
      alt: title,
    },
  ];
}

export function MockCreatedLovisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // El estado inicial es SIEMPRE el mismo en servidor y cliente ([]). El
  // valor guardado se aplica recien despues de montar, asi React no compara
  // HTML distinto para el mismo render.
  const [createdLovis, setCreatedLovis] = useState<MockLovi[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCreatedLovis(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createdLovis));
    } catch {
      // Modo privado o cuota llena: la sesion sigue funcionando en memoria.
    }
  }, [createdLovis, ready]);

  const addLovi = useCallback((input: CreateLoviInput) => {
    const id = `lovi-local-${crypto.randomUUID()}`;
    const lovi: MockLovi = {
      id,
      petId: input.petId,
      title: input.title,
      description: input.description,
      createdAt: new Date().toISOString(),
      media: buildMedia(id, input.title, input.mediaKind),
    };
    // Se agrega arriba de la lista: el orden final lo decide el sort por
    // createdAt en index.ts, pero el prepend hace que el feed reaccione
    // de forma intuitiva.
    setCreatedLovis((prev) => [lovi, ...prev]);
  }, []);

  const value = useMemo<CreatedLovisContextValue>(
    () => ({ createdLovis, addLovi, ready }),
    [createdLovis, addLovi, ready],
  );

  return (
    <CreatedLovisContext.Provider value={value}>
      {children}
    </CreatedLovisContext.Provider>
  );
}

export function useMockCreatedLovis(): CreatedLovisContextValue {
  const ctx = useContext(CreatedLovisContext);
  if (!ctx) {
    throw new Error(
      "useMockCreatedLovis debe usarse dentro de <MockCreatedLovisProvider>",
    );
  }
  return ctx;
}
