# Feature: lovi-mvp

## Objective
Completar el MVP funcional de Lovi sobre la base Next.js + Supabase existente en `/Users/lolagarcia/Desktop/lovi-app` (repo-relative: `lovi-app/`).

## Problem / Why
La base ya tiene auth, layout autenticado, feed, capa de lectura, sistema de diseño y migraciones 0001/0002 (RLS owner-only). Falta: Storage (migración 0003), mutaciones, y todas las rutas de feature. El plan respeta 0001/0002, el modelo owner-only y la dirección de arte definida.

## Scope / Constraints
- NO modificar `supabase/migrations/0001_init.sql` ni `0002_security.sql`.
- NO usar service role en el frontend, NO desactivar RLS.
- Rutas nuevas bajo `app/(app)/`.
- Reutilizar `lib/queries.ts` (lecturas), `lib/media.ts` (firmado), `lib/types.ts`, `lib/format.ts`.
- Buckets privados: `pets` y `lovi-media`, políticas owner-only por carpeta `{user_id}/...`.
- Sin tablas nuevas. Sin colaboradores/features sociales.
- Arte oficial: paleta existente en tailwind + clases `.card-lovi`, `.btn-loviar`, etc.

## Authorized scope
Implementación del MVP por fases tal como acordó el usuario. No commitear sin pedido explícito (hay 44 archivos sin commitear en el repo).

## Tasks
- [x] T1 Base: migración 0003 storage (buckets + políticas), helpers upload/delete, server actions (pets/lovis/media/albums/vacunas/turnos/perfil), fix redirect /protected, firmar pet_image
- [x] T2 Mascotas: /pets, /pets/new, /pets/[id], /pets/[id]/edit + formulario con foto
- [x] T3 Loviar + feed: /loviar multi-media (image/video/audio), publicación, feed multimedia
- [x] T4 Álbumes: /pets/[id]/albums, crear/abrir/agregar lovis
- [x] T5 Calendario: /calendar journal visual, navegación de meses, detalle por día
- [x] T6 Vacunas y turnos: /pets/[id]/vaccines, /pets/[id]/appointments
- [x] T7 Perfil + pulido: /profile, auth forms en español + arte Lovi, empty/loading/error, responsive

## Acceptance Criteria
Registrarse, login, crear/ver/editar mascota, crear Lovi con imagen/video/audio, verlo en feed, calendario por fecha, álbumes, vacunas, turnos, logout, persistencia, aislamiento entre usuarios.

## Verification (per phase)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Fix errors before continuing.

## Progress
- Fase 1 (T1): ✅ completa — lint/tsc/build OK. `supabase/migrations/0003_storage.sql` (buckets pets/lovi-media/profiles, políticas owner-only por carpeta `{user_id}/...`), `lib/storage.ts`, `lib/actions.ts`, fix redirect en `update-password-form`, `getPetForEdit`, firma de `pet_image`. **No aplicada al remoto** (requiere `supabase login` / access token del usuario).
- Fase 2 (T2): ✅ completa — lint/tsc/build OK. `components/pet-form.tsx`, rutas `/pets`, `/pets/new`, `/pets/[id]`, `/pets/[id]/edit`, secciones del perfil.
- Fase 3 (T3): ✅ completa — lint/tsc/build OK. `components/lovi-form.tsx` (multi-upload image/video/audio con re-subida protegida), `/loviar`, `DeleteLoviButton` integrado al feed.
- Fase 4 (T4): ✅ completa — lint/tsc/build OK. Rutas albums list/new/[albumId], `AlbumForm`, `AddLoviToAlbum`, `RemoveLoviFromAlbum`, `DeleteAlbumButton`.
- Fase 5 (T5): ✅ completa — lint/tsc/build OK. `/calendar` con grilla mensual (lunes-primero), marcas por día, navegación de meses, detalle por día (`DayDetail`, `CalLabel`). Helpers `monthStart/daysInMonth/weekdayIndexMonday` en format.ts. NO depende de date-fns.
- Fase 6 (T6): ✅ completa — lint/tsc/build OK. `VaccineForm`, `AppointmentForm` (datetime-local→ISO), listas agrupadas por año / próximos-pasados, botones de borrado.
- Fase 7 (T7): ✅ completa — lint/tsc/build OK. `/profile` con foto (profiles bucket), `ProfileForm`, logout, `loading.tsx`/`error.tsx` del grupo, `forgot-password-form` y `update-password-form` traducidos a español, `signProfileImage` en media.ts.

## Resolved during implementation
- Next 16 + `cacheComponents`: `export const dynamic` no compila; se usa `export const instant = false` en `app/(app)/layout.tsx`.
- lint: destructuring-rést con variables no usadas en `attachMedia`; reescrito con retorno explícito.
- date-fns NO está instalado en el proyecto; el calendario se construye con helpers propios de `lib/format.ts` para no agregar dependencias.

## Pending / outside code
- [ ] Aplicar migración 0003 al remoto: `supabase login` (o `SUPABASE_ACCESS_TOKEN`) y `supabase db push --linked`. La CLI global `supabase@2.117.0` ya está instalada vía Homebrew (el paquete local de node_modules no tiene binario para darwin-arm64).
- [ ] Probar manualmente el flujo end-to-end (registro → mascota → loviar → feed → calendario → álbumes → vacunas/turnos → perfil).
- [ ] Commit/PR bajo política del repo (el usuario no pidió commitear).