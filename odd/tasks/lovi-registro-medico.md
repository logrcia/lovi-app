# Feature: lovi-registro-medico

## Objective
Agregar una sección **Registro médico** dentro del perfil de cada mascota con dos tabs: **Vacunas** y **Estudios y controles**. Funciona como historial de salud independiente del calendario y de los turnos.

## Problem / Why
- La app ya tiene vacunas por mascota (`/pets/[id]/vaccines`) pero NO tiene historial de estudios/controles ni notas en las vacunas.
- HOY las vacunas aparecen como eventos del calendario (`getMonthCalendarMarks`, kind "vaccine"). El usuario pide explícitamente que **no** aparezcan: el registro médico debe estar desacoplado del calendario y registrar no debe crear turnos/eventos.

## Scope / Constraints
- NO tocar auth. NO tocar turnos ni su vínculo con el calendario (siguen como están).
- Reutilizar patrones existentes: RLS owner-only vía subquery a `pets` (0002), queries en `lib/queries.ts`, server actions en `lib/actions.ts`, tokens Lovi (card-lovi, sticker, btn-ink, btn-ghost-ink, lovi-headline), `VaccineForm`/`DeleteVaccineButton`, `formatFullDate`.
- UI copy en español.
- No commitear sin pedido explícito (convención del repo).
- TDD: no hay test runner configurado → checks funcionales: lint + tsc + build + script e2e contra Supabase.

## Tasks
- [x] T1 Migración `0005_medical_records.sql`: `ALTER vaccines ADD COLUMN notes`, tabla `pet_exams` (exam_id, pet_id FK CASCADE, name, exam_date, result, notes) + índice + RLS mirror de vaccines (insert/select/update/delete own_pet).
- [x] T2 Tipos/queries/actions: `Vaccine.notes`, type `PetExam`, `getPetExams`, `createVaccine/updateVaccine/deleteVaccine` con notes y sin revalidate de /calendar, `createPetExam/updatePetExam/deletePetExam` (nunca tocan /calendar), `getMonthCalendarMarks` sin vaccinas, eliminar `getDayVaccines`.
- [x] T3 Página `/pets/[id]/medical` con tabs (Vacunas | Estudios y controles) vía `?tab=`, listas agrupadas por año, formularios y edición inline.
- [x] T4 Componentes: extender `VaccineForm` (initial + notes + onSaved/onCancel), `VaccineItem` (card con Editar/Borrar), `PetExamForm`, `PetExamItem`, `DeletePetExamButton`.
- [x] T5 Desacople calendario: `cal-label.tsx`, `calendar/page.tsx` y `day-detail.tsx` sin kind/props de vaccine; copy actualizada.
- [x] T6 Perfil de mascota: reemplazar card "Vacunas" por "Registro médico" (count = vacunas + estudios), redirect de `/pets/[id]/vaccines` → `/pets/[id]/medical?tab=vaccines`.
- [x] T7 Aplicar migración al remoto (`supabase db push --linked`, CLI ya logueada, 0001-0004 presentes).
- [x] T8 Script e2e `lovi-medical-test.mjs`: persistencia, CRUD, pertenencia por mascota, RLS (B no ve ni escribe en A), cleanup.
- [x] T9 Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios.

## Acceptance Criteria
1. Desde el perfil de la mascota se entra a "Registro médico" con tabs Vacunas / Estudios y controles.
2. Se puede agregar, ver, editar y eliminar vacunas (con nota) y estudios (nombre, fecha, resultado, nota).
3. Cada registro pertenece a la mascota correcta y persiste en Supabase (RLS owner-only).
4. Registrar NO crea turnos/eventos; las vacunas YA NO aparecen en el calendario; los turnos siguen apareciendo.
5. Build limpio sin errores.

## Verification (per task)
- `npm run lint` (0 errores; warning preexistente de media-item no es fallo)
- `npx tsc --noEmit`
- `npm run build`
- T8: script e2e contra Supabase real (anon key + RLS)

## Progress
- Auditoría inicial: perfil de mascota arma `SECTIONS` (Recuerdos, Álbumes, Vacunas, Turnos) con count y hrefs; `/pets/[id]/vaccines` ya existe con `VaccineForm` (solo create) + `DeleteVaccineButton` + agrupado por año; `vaccines` NO tiene columna notes; **sí aparece en calendario** (`getMonthCalendarMarks` kind "vaccine" + `getDayVaccines` usado en calendar/day-detail); `appointments` se mantiene en calendario (requisito: intacto); RLS de vaccines es patrón "own_pet" vía EXISTS a pets (lo replico para pet_exams); CLI supabase logueada, proyecto vinculado (ref rtqhrzmhulfqgnescrxx), migraciones 0001-0004 aplicadas en remoto.
- Decisiones de producto: (1) la card del perfil "Vacunas" pasa a "Registro médico" (evita duplicar entradas para la misma sección); (2) las vacunas salen del calendario (pedido explícito); (3) edición incluida (pedido explícito, "si es sencillo"; el patrón server action + RLS lo permite sin rutas nuevas); (4) `result` de estudios opcional (permite cargar estudios sin resultado todavía); (5) `/pets/[id]/vaccines` queda como redirect a `/pets/[id]/medical?tab=vaccines` (links viejos siguen vivos).
- Ruteo registrado: T2-T6 → writer delegado (trigger: 2+ archivos no triviales); exploración inline por fallo del subagente explore (límite free tier del proveedor); T7-T9 → orquestador (migración + script + checks).
- Implementación (writer delegado, modelo principal): 7 archivos creados, 9 modificados. `lint` exit 0 (1 warning preexistente media-item), `tsc --noEmit` exit 0, `build` exit 0 (ruta `/pets/[id]/medical` en output).
- Spot check del orquestador: página medical OK (tabs `?tab=`, agrupado por año, VaccineItem/PetExamItem, notFound); forms con modo edición (initial/onSaved/onCancel); items card con Editar/Borrar; migración 0005 correcta (schema + índice + RLS own_pet). `gentle-ai review assess` → risk **medium** (executable_change en calendar/page.tsx), review_due false (under_budget); GATE RDD off: writer self-verification + spot check (re-corrí `npx tsc --noEmit` → exit 0; `npm run lint` → 0 errores). Greps de desacople: cero referencias a vaccine en calendar/day-detail/cal-label; `getDayVaccines` eliminado; los 7 `revalidatePath("/calendar")` restantes pertenecen solo a pets/lovis/turnos.
- T7 ✅: migración 0005 aplicada al remoto (`supabase db push --linked`; migration list muestra 0005 local=remote). La tabla pet_exams existe con RLS activo.
- T8 ✅: `node lovi-medical-test.mjs` → **18 checks, 0 FAIL** contra Supabase real (anon + RLS): crear/leer vacuna con nota y estudio con resultado+nota, pertenencia por pet_id, editar vacuna y estudio, RLS (B no ve/inserta/actualiza/borra registros de A), NO se crean turnos al registrar, eliminar. Cleanup ejecutado.
- T9 ✅: `npm run lint` 0 errores (1 warning preexistente), `npx tsc --noEmit` exit 0, `npm run build` exit 0.
- Sin commits (convención del repo: no commitear sin pedido).
- PENDIENTE (verificación humana): recorrido en browser con sesión (perfil → Registro médico → tabs → agregar/editar/eliminar; calendario sin vacunas, con turnos).