# Feature: home-recuerdos-recomendados (prototipo /mock)

## Objective
Mezclar en el scroll del home del prototipo (`app/(mock)/proto/page.tsx` -> `components/proto-home.tsx`) recomendaciones de recuerdos de mascotas que el viewer **no sigue**, intercaladas entre los recuerdos de mascotas que **sí sigue** (feed actual del mock).

## Problem / Why
- El home del prototipo solo muestra lovis de mascotas propias + seguidas (`getMockFeed`).
- El usuario pidió ver recomendaciones de mascotas no seguidas dentro del mismo scroll del prototipo, para descubrir contenido nuevo sin salir del feed.
- Es solo el prototipo (mock, `lib/mock-data/`). **NO tocar Supabase, `lib/queries.ts`, `lib/types.ts` (real), `app/(app)/*` ni migraciones.**

## Scope / Constraints
- SOLO `app/(mock)/proto/**`, `lib/mock-data/**`, `components/proto-*` y `components/feed-card.tsx`.
- NO tocar Supabase, `lib/actions`, `lib/queries` (real), `app/(app)/**` ni `supabase/migrations/*`.
- Modelo del proto: USUARIO → SIGUE → MASCOTA. Nunca se siguen usuarios. "Cuenta no seguida" = mascota ajena no seguida.
- Intercalado: 1 recomendación cada 3 recuerdos del feed, el feed primero.
- Etiqueta de UI: "De cuentas que no seguís" (badge/tag en la tarjeta recomendada).
- Los datos siguen siendo mock sincronos y puros (index.ts es la API publica).

## Authorized scope
Implementar solo en el prototipo. db push / Supabase no se tocan.

## Tasks
- [x] T1 (Tipos mock): `lib/mock-data/types.ts` — `isRecommendation?: boolean` en `FeedLovi`.
- [x] T2 (Query mock): `lib/mock-data/index.ts` — `getMockRecommendedLovis(followedPetIds, extraLovis)`: lovis de mascotas ajenas NO seguidas, `isRecommendation: true`, orden por fecha desc.
- [x] T3 (Página home proto): `components/proto-home.tsx` — mezclado 1:3 (feed primero), paginación incremental sobre la lista mezclada, empty states sin tocar.
- [x] T4 (Componente): `components/feed-card.tsx` — badge sticker fucsia "De cuentas que no seguís" cuando `isRecommendation`.
- [x] T5 (Verificación): `npx tsc --noEmit`, `npm run build`, `npm run lint` (archivos cambiados) limpios.

## Checklist
- [x] T1 tipo FeedLovi con isRecommendation
- [x] T2 getMockRecommendedLovis en index.ts
- [x] T3 proto-home mezcla intercalada + etiqueta
- [x] T4 feed-card badge de recomendación
- [x] T5 tsc/build/lint OK

## Progress
- Exploración de decisión: lecturas inline de proto-home.tsx, feed-card.tsx, index.ts (mock), types.ts (mock), pets.ts, lovis.ts, follows.tsx, created-lovis.tsx, app/(mock)/proto/page.tsx.
- Proyecto real (Supabase) REVERTIDO: sin cambios en lib/queries.ts, lib/types.ts (real), app/(app)/*, ni migraciones. Migración 0006 no creada.

## Verification evidence
- `npx tsc --noEmit` → exit 0 (limpio)
- `npm run build` → exit 0 (build OK)
- `npx eslint` sobre los 4 archivos cambiados → exit 0 (limpio)
- Readback estructural por el orquestador: types.ts (isRecommendation en FeedLovi), index.ts (getMockRecommendedLovis), proto-home.tsx (interleaveFeedAndRecommendations 1:3, feed primero, paginación sobre merged), feed-card.tsx (badge sticker fucsia "De cuentas que no seguís") — todo conforme al doc.

## Notes / decisiones de diseño
- Intercalado 1:3 (feed:recomendación). El feed va primero; sobrantes van al final.
- Etiqueta "De cuentas que no seguís" como badge sticker fucsia en el header de la tarjeta recomendada.
- Solo prototipo mock; sin Supabase, sin migración, sin db push, sin commit.
- getMockRecommendedLovis reusa hydrateLovi; nunca muta MOCK_LOVIS; extraLovis (recuerdos creados) entran al origen pero quedan excluidos al ser de mascotas propias del viewer.