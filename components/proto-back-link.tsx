"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Back del prototipo: vuelve a la pantalla de la que SALISTE, no a una fija.
 *
 * Antes cada pantalla hardcodeaba su destino ("tu perfil" en el perfil de
 * mascota, "explorar" en el perfil humano). Entrando a una mascota desde
 * Explorar, el back caia a "tu perfil": dos saltos para volver donde estabas.
 *
 * El destino viaja en ?from= y lo pone el link que ENTRA. Se eligio asi, y no
 * con window.history, por dos motivos concretos:
 *
 * 1. window.history no sirve. En App Router el back es una navegacion del
 *    cliente sobre el MISMO documento, asi que document.referrer y el indice
 *    de history no distinguen "vengo de explorar" de "vengo de tu perfil".
 *    Tampoco sirve router.back(): en un link directo o un refresh no hay
 *    historial del prototipo y el usuario se va de la app.
 * 2. ?from= es explicito, sobrevive a recarga y F5, y funciona en un link
 *    compartido. Un usuario que abre /proto/pets/pet-luna pegado recibe el
 *    fallback en vez de un ?from= de otra sesion.
 *
 * NO se usa useSearchParams: con cacheComponents estas pantallas se
 * prerenderizan y ese hook exige un <Suspense> en cada pagina.
 *
 * Si no hay ?from=, cada pantalla declara en `fallback` adonde ir cuando no hay
 * de donde volver.
 */

const BACK_LINK_CLASS =
  "mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink/50 transition-colors hover:text-ink";

/**
 * Solo rutas internas del prototipo. Un ?from= es control de navegacion, no
 * una URL arbitraria: si viniera de afuera (redirect de login, link pegado con
 * ese parametro) el back tiene que quedarse adentro.
 */
function isInternalProtoPath(value: string): boolean {
  return value.startsWith("/proto") && !value.startsWith("//");
}

function readFromParam(): string | null {
  if (typeof window === "undefined") return null;
  const from = new URLSearchParams(window.location.search).get("from");
  return from && isInternalProtoPath(from) ? from : null;
}

/** Destino del back: la pantalla de la que se salio, o `fallback`. */
export function useBackHref(fallback: string): string {
  const [href, setHref] = useState(fallback);
  useEffect(() => {
    setHref(readFromParam() ?? fallback);
  }, [fallback]);
  return href;
}

/**
 * Link de retroceso. `label` es el texto visible; `fallback` el destino cuando
 * la pantalla se abrio directa y no hay de donde volver.
 */
export function ProtoBackLink({
  label,
  fallback,
  className,
}: {
  label: string;
  fallback: string;
  className?: string;
}) {
  const href = useBackHref(fallback);
  return (
    <Link href={href} className={cn(BACK_LINK_CLASS, className)}>
      <ArrowLeft size={13} strokeWidth={2.5} />
      {label}
    </Link>
  );
}

/**
 * Propaga la pantalla actual al link de destino, para que su back sepa a
 * donde volver. Todo link que ENTRA a un perfil o a una seccion lo usa.
 */
export function withFrom(href: string, from: string): string {
  return `${href}?from=${encodeURIComponent(from)}`;
}