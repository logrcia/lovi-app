# Feature: proto-ver-album

## Objective
Hacer clicables los álbumes en la sección **Álbumes** del perfil de mascota del prototipo `/proto`: cada tarjeta abre una nueva pantalla de detalle del álbum que muestra los recuerdos (lovis) guardados en ese álbum.

## Why
Fase de refinamiento del prototipo `/proto` (validación de producto, 100% mock, Supabase congelado). El usuario pidió poder entrar a un álbum y ver los recuerdos que contiene. Hoy `AlbumList` renderiza tarjetas inertes: no hay ruta de detalle ni datos de pertenencia (equivalente mock de la tabla `album_lovis`).

## Scope
- SOLO el prototipo `app/(mock)/proto/**` + capa mock `lib/mock-data/**` + componentes `proto-*`. NO tocar Supabase, `lib/actions`, `lib/queries` ni `app/(app)/**`.
- Nueva ruta `/proto/pets/[id]/albums/[albumId]` con detalle del álbum y sus lovis.
- Membresía mock `albumId -> [loviIds]`: un lovi solo puede pertenecer a álbumes de SU mascota; se admite que un lovi esté en más de un álbum (el join real lo permite).
- `loviCount` pasa a DERIVARSE de la membresía: los valores sembrados hoy (7, 5, 6, 8…) no coinciden con los lovis reales por mascota (2–4) y la lista mintiría frente al detalle.
- Los lovis creados en el prototipo (created-lovis) NO entran a álbumes: no existe flujo de "agregar al álbum" en el proto. La membresía es estática.
- Copy de UI en español del prototipo; identifiers/comentarios en inglés técnico.

## Constraints
- `index.ts` es la API pública: la hidratación de lovis del álbum (`hydrateLovi` es privada) vive en `index.ts`; `pet-sections.ts` queda como fuente de datos crudos (patrón ya usado por `proto-pet-section`/`proto-pet-profile`).
- Seguir el patrón de pantalla de las secciones hermanas: página server con `generateStaticParams`, `notFound()` por entidad faltante o álbum que no pertenece a la mascota, `<Suspense>` con fallback, `metadata.title`.
- Back con `ProtoBackLink` + `withFrom(...)` desde el listado (mismo contrato de `?from=` del resto del proto).
- Gating de renders con `ready` de `useMockFollows` (como `proto-pet-profile`).
- Verificación: `npx eslint <archivos tocados>` + `npx tsc --noEmit` + `npm run build` (no hay framework de tests; el repo tiene 1 error + 1 warning preexistentes ajenos).

## Route declaration
- Exploración de decisión: inline (lecturas acotadas ya realizadas por el orquestador: pet-sections, proto-pet-section, index.ts, lovis.ts, albums/page real, album/[albumId]/page real, proto-pet-profile, proto-back-link).
- Implementación: **delegated direct** (writer único). Trigger: writer (5 archivos, 2 nuevos no triviales).

## Checklist
- [x] T1: `lib/mock-data/pet-sections.ts` — `MOCK_ALBUM_LOVIS` (membresía sembrada), `getMockAlbum(petId, albumId)`, `getMockAlbumLoviIds(albumId)`; `getMockAlbums` deriva `loviCount` de la membresía (quita el literal sembrado).
- [x] T2: `lib/mock-data/index.ts` — `getMockAlbumBundle(petId, albumId, followedPetIds)` → `{ album, lovis: FeedLovi[] } | null` (valida pertenencia, hidrata con `hydrateLovi`, orden desc como el resto); `getMockAlbumParams()` para `generateStaticParams`.
- [x] T3: `components/proto-album-detail.tsx` — Client Component: `ProtoBackLink` (fallback a la lista de álbumes), sticker "álbum", título, banner de cover, "N recuerdos · fecha", lista de `FeedCard` con `tilt` alterno y `from`, estado vacío ("Este álbum está vacío."), gate `ready`.
- [x] T4: `app/(mock)/proto/pets/[id]/albums/[albumId]/page.tsx` — `generateStaticParams`, `notFound()` si falta pet/álbum o si el álbum no es de esa mascota, `<Suspense>` + fallback, `metadata`, render de `ProtoAlbumDetail`.
- [x] T5: `components/proto-pet-section.tsx` — `AlbumList`: cada tarjeta envuelta en `Link` con `withFrom` a la ruta de detalle, hover affordance consistente con las tarjetas del proto.
- [x] T6: Verificación: eslint aislado de archivos tocados + `npx tsc --noEmit` + `npm run build`, resultados observados acá.

## Progress
- [x] Exploración de decisión (8 archivos leídos inline).
- [x] T1-T6 implementados (writer único, delegated direct).
- [x] T6 verificado.

## Verification evidence
- `npx eslint` aislado sobre los 5 archivos tocados → exit 0, sin errores.
- `npx tsc --noEmit` → exit 0 (corrido por el writer Y repetido por el orquestador como spot check: exit 0).
- `npm run build` → exit 0; la ruta nueva se prerenderiza (`/proto/pets/pet-vitto/albums/album-cachorro` … 6 parámetros de álbum).
- Readback estructural por el orquestador: `components/proto-album-detail.tsx`, `app/(mock)/proto/pets/[id]/albums/[albumId]/page.tsx`, membresía `MOCK_ALBUM_LOVIS` + `loviCount` derivado en `pet-sections.ts`, `Link withFrom` en `AlbumList` — todo conforme al doc.
- RDD: off → gate de verificación delegada: riesgo `medium` (`gentle-ai review assess`, 162 changed lines, `under_budget`), tier medio = self-verification del writer + spot check del orquestador (ambos hechos).

## Notes / decisiones de diseño
- Membresía propuesta (solo lovis de la misma mascota):
  - `album-cachorro` (vitto): lovi-01, lovi-16, lovi-19 → 3
  - `album-verano` (vitto): lovi-04 → 1
  - `album-caja` (luna): lovi-03, lovi-17 → 2
  - `album-atajante` (milo): lovi-18 → 1
  - `album-corridas` (mora): lovi-07 → 1
  - `album-huerto` (nina): lovi-09 → 1
- Estado vacío: se implementa el copy defensivo aunque hoy ningún álbum quede vacío.
