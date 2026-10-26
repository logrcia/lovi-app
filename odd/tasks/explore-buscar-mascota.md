# Feature: explore-buscar-mascota (prototipo /mock)

## Objective
Agregar una barra de búsqueda en la sección Explorar (`components/proto-explore.tsx`) para escribir el nombre de una mascota y filtrar las descubribles, pudiendo entrar al perfil desde el resultado.

## Problem / Why
- Explorar hoy solo lista mascotas ajenas no seguidas, ordenadas por seguidores, sin forma de buscar por nombre.
- El usuario quiere escribir el nombre de una mascota para encontrarla rápido y entrar a su perfil.

## Scope / Constraints
- SOLO `components/proto-explore.tsx` (prototipo /mock).
- NO tocar Supabase, `lib/queries.ts` (real), `lib/types.ts` (real), `app/(app)/*`, ni `supabase/migrations/*`.
- Datos mock sincronos y puros; el filtro se hace en memoria sobre el array ya devuelto por `getMockDiscoverablePets`.
- Búsqueda por `name`, case-insensitive, coincidencia parcial (contiene).
- Cuando no hay coincidencias: mostrar empty state / mensaje claro.
- Cuando el input está vacío: mostrar el listado completo tal como hoy.
- Copy de UI en español.

## Authorized scope
Implementar solo en el prototipo. Sin Supabase, sin migración, sin commit.

## Tasks
- [x] T1 (Componente): `components/proto-explore.tsx` — input de búsqueda controlado (`useState` para el query), filtrar `discoverable` por nombre antes de renderizar, mostrar "No se encontró ninguna mascota con ese nombre" cuando el array filtrado queda vacío (y hay query escrito), CTA "Limpiar búsqueda".
- [x] T2 (Verificación): `npx tsc --noEmit`, `npm run build`, `npm run lint` (archivo cambiado) limpios.

## Checklist
- [x] T1 input de búsqueda + filtrado por nombre en proto-explore.tsx
- [x] T2 tsc/build/lint OK

## Progress
- Exploración de decisión: lecturas inline de proto-explore.tsx, pet-card.tsx, index.ts (getMockDiscoverablePets), empty-state.tsx, app/(mock)/proto/explore/page.tsx.
- Implementación delegada a writer único (1 archivo no trivial).

## Verification evidence
- `npx tsc --noEmit` → exit 0 (limpio)
- `npx eslint components/proto-explore.tsx` → exit 0 (limpio)
- `npm run build` → exit 0 (build OK, generó /proto/explore)
- Readback estructural: proto-explore.tsx tiene useState query, filtro case-insensitive `pet.name.toLowerCase().includes(normalized)`, empty state "No se encontró ninguna mascota con ese nombre" + CTA "Limpiar búsqueda", listado completo cuando input vacío, empty state existente "Ya seguís a todas las mascotas" preservado.

## Notes / decisiones de diseño
- Filtro en memoria sobre `getMockDiscoverablePets(followedPetIds)` (ya excluye propias y seguidas).
- Input controlado con `useState("")`; filtro case-insensitive con `includes`.
- Usó `TextInput` de `@/components/form` (ya existente, usado por otros formularios del proyecto).
- Empty state de "sin coincidencias" dibujado a mano con botón "Limpiar búsqueda" (no es Link porque no es navegación).
- Mantener orden por seguidores.
- Solo prototipo mock; sin Supabase, sin migración, sin commit, sin db push.