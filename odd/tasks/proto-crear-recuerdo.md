# Feature: proto-crear-recuerdo

## Objective
Agregar, dentro de la sección **Recuerdos** del perfil de una mascota propia del prototipo `/proto`, un botón **"Crear recuerdo"** que abre un formulario con los campos de creación (título, historia, tipo de medio) y que, al enviarlo, inserta el recuerdo nuevo arriba de la lista y en el Home.

## Why
Fase de refinamiento del prototipo `/proto` (entorno de validación de producto, 100% mock, Supabase congelado). El usuario pidió continuar con el prototipo agregando el flujo de creación de un recuerdo.

## Scope
- SOLO el prototipo `app/(mock)/proto/**` + capa mock `lib/mock-data/**`. NO tocar Supabase, acciones reales ni `app/(app)/**`.
- El botón aparece SOLO en mascotas propias (`isOwner`), en la sección Recuerdos del perfil de mascota.
- El medio se simula con un selector de tipo (Foto / Video / Audio / Solo texto) y placeholders SVG generados, consistente con todo el mock (nunca hay media real en el proto).
- Se agrega persistencia de recuerdos creados en localStorage (patrón idéntico a `MockFollowProvider`).

## Constraints
- Seguir el patrón de `follows.tsx`: Context + useState + localStorage, `ready` para evitar hydration mismatch, estado inicial idéntico servidor/cliente.
- `index.ts` es la única API pública: las funciones de lectura reciben el estado created-lovis como PARÁMETRO (igual que los follows), no lo leen solas.
- Artefactos técnicos en inglés de código; UI copy en español del prototipo (consistente con el resto).
- Verificación: `npm run lint` + `npx tsc --noEmit` + `npm run build` (no hay framework de tests en el proyecto).

## Route declaration
- Todos los archivos: **delegated direct** (writer único). Triggers: writer (2+ archivos no triviales), mapping (6+ archivos leídos para exploración).

## Checklist
- [x] T1: `lib/mock-data/created-lovis.tsx` — `MockCreatedLovisProvider` + `useMockCreatedLovis` (createdLovis, addLovi, ready) con persistencia `LOVI_MOCK_CREATED_LOVIS` y generación de media placeholder por tipo.
- [x] T2: `lib/mock-data/index.ts` — firmas de `getMockFeed` / `getMockPetLovis` / `getMockFeedPage` aceptan `extraLovis?: readonly MockLovi[]` (default `[]`), hidratados con el mismo `hydrateLovi`.
- [x] T3: `components/proto-lovi-form.tsx` — formulario cliente: título (requerido), historia (opcional), selector de tipo de medio, submit llama `addLovi`, cancel/reset.
- [x] T4: `components/proto-pet-profile.tsx` — botón "Crear recuerdo" (solo isOwner, junto al h2 Recuerdos), toggle del form, lista y count mergean created-lovis vía el parámetro nuevo.
- [x] T5: `components/proto-home.tsx` — el feed pasa `createdLovis` a `getMockFeed`.
- [x] T6: `app/(mock)/layout.tsx` — envolver con `MockCreatedLovisProvider` dentro de `MockFollowProvider`.
- [x] T7: Verificación: lint + tsc + build, resultados observados acá.

## Progress
- [x] Exploración completa (6 archivos leídos: proto-pet-profile, lovi-form, mock-data index/lovis/types/follows, layout, feed-card, pet-card, form.tsx, globals.css, package.json).
- [x] T1-T6 implementados.
- [x] T7 verificado.

## Verification evidence
- `npm run lint`: 1 error + 1 warning, ambos PREEXISTENTES y ajenos a este cambio (`lovi-medical-test.mjs` `'userB' is assigned a value but never used` — commiteado en `1e663cf medical section`, sin modificar; `media-item.tsx` warning de `no-img-element`). Verificación aislada de los 6 archivos tocados: `npx eslint components/proto-lovi-form.tsx components/proto-pet-profile.tsx components/proto-home.tsx lib/mock-data/created-lovis.tsx lib/mock-data/index.ts app/(mock)/layout.tsx` → exit 0, sin errores.
- `npx tsc --noEmit`: exit 0, sin errores.
- `npm run build`: exit 0, build completo (rutas /proto/* prerenderizadas correctamente).
