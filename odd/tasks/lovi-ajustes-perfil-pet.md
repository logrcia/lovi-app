# Feature: lovi-ajustes-perfil-pet

## Objective
Ajustes visuales/funcionales de cierre sobre el MVP de Lovi (ya implementado, Ronda 2 completa):
1. **Mi perfil** (`/profile`): mostrar seguidores y seguidos reales de Supabase + botón "Editar perfil".
2. **Perfil de mascota** (`/pets/[id]`): mejorar composición del layout (imagen contenida en desktop, equilibrada con la info, cómoda en mobile).

## Problem / Why
- `/profile` hoy es solo el formulario de edición; no muestra counts sociales aunque la capa social ya existe (RPC `get_follow_counts`, tabs en `/users/[id]`).
- `/pets/[id]` tiene un header funcional pero plano; la foto domina la página y la composición no se siente cuidada en desktop ni mobile.

## Scope / Constraints
- NO tocar autenticación ni RLS. NO crear migraciones ni tablas nuevas (la capa de follows ya existe y está aplicada: 0004).
- NO cambiar funcionalidades que funcionan (formulario de perfil, acciones, RPC existentes).
- Reutilizar: `getFollowCounts`, `getProfile`, `signProfileImage`, `PetImage`, `ProfileForm`, `formatLongDate`, tokens Lovi (`card-lovi`, `sticker`, `btn-ink`, `lovi-headline`).
- UI copy en español (idioma del proyecto).
- No commitear sin pedido explícito.
- TDD: no hay test runner configurado en package.json → checks funcionales: lint + tsc + build.

## Tasks
- [x] T1 (Mi perfil) `/profile`: card resumen con avatar, nombre, "Miembro desde", counts de seguidores/siguiendo (RPC real, links a los tabs existentes `/users/[id]?tab=...`) + componente `ProfileEdit` (botón "Editar perfil" que revela el `ProfileForm` existente)
- [x] T2 (Mi perfil) `toggleFollow` en `lib/actions.ts`: agregar `revalidatePath("/profile")` para que los counts propios se refresquen tras seguir/dejar de seguir
- [x] T3 (Perfil mascota) `/pets/[id]`: header rediseñado (imagen contenida 176px mobile / 208px desktop con leve rotación, chips de metadata, descripción con mejor lectura, botón Editar arriba a la derecha de la info), secciones intactas
- [x] T4 Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios; spot check de rutas /profile y /pets/[id]

## Acceptance Criteria
1. Mi perfil muestra seguidores y seguidos reales de Supabase y se actualizan tras follow/unfollow.
2. "Editar perfil" abre el editor existente (nombre + foto, email readonly) con estética Lovi.
3. Perfil de mascota: imagen contenida y composición equilibrada en desktop; cómodo y responsive en mobile.
4. Sin errores de build ni de consola; sin regresiones en auth/relaciones.

## Verification (per task)
- `npm run lint` (0 errores; 1 warning preexistente en media-item: no-img-element — no es fallo)
- `npx tsc --noEmit`
- `npm run build`
- Revisión estructural del diff (rutas /profile y /pets/[id])

## Progress
- Auditoría inicial: capa social existe (RPC `get_follow_counts` en 0004, granted a authenticated; tabs seguidores/siguiendo en /users/[id]); `ProfileForm` ya edita nombre+foto (email readonly); header de /pets/[id] es card-lovi con foto fija h-44 w-44.
- Ruta elegida: writer delegado único (trigger: 3+ archivos no triviales) con spec completa; verificación del writer + spot check del orquestador.
- T1 implementado: `/profile` reescrito (card resumen con `PetImage` avatar, counts reales vía `getFollowCounts` con fallback 0/0 si `!userId`, links a tabs de seguidores/siguiendo) + `components/profile-edit.tsx` nuevo (toggle "Editar perfil"/"Cancelar", revela `ProfileForm` existente sin tocarlo). Header del page ahora dice "Mi perfil".
- T2 implementado: `toggleFollow` revalida también `/profile` (counts propios al día tras follow/unfollow).
- T3 implementado: header de `/pets/[id]` rediseñado (imagen h-44 mobile/h-52 desktop contenida con rotación, chips de metadata especie/nacimiento/edad, descripción sin line-clamp, botón Editar arriba a la derecha). Secciones y hrefs intactos; `export const instant = false` conservado en ambos pages.
- Verificación del writer (los 3 pasan): `npm run lint` → 0 errores, 1 warning preexistente en media-item.tsx (no-img-element, no tocado); `npx tsc --noEmit` → exit 0; `npm run build` → exit 0 (Next 16.3.0, 28 páginas OK).
- Spot check del orquestador (T4): readback estructural de los 4 archivos OK (tokens Lovi, `instant = false` conservado, ProfileForm intacto, secciones de /pets/[id] intactas, diff de actions = solo +revalidatePath). `gentle-ai review assess` → risk **medium** (GATE RDD off: writer self-verification como registro; sin verifier extra porque el writer corrió en el modelo principal, no mini). `npx tsc --noEmit` re-corrido → exit 0. `npm run lint` re-corrido → 0 errores. Smoke `npm start` + curl: /profile → 307 /auth/login, /pets/abc → 307 /auth/login (guard de auth del layout, sin crash), /auth/login → 200; log del server sin errores/warnings.
- Ruteo registrado: T1-T3 → writer delegado único (trigger Mandatory Delegation: 3+ archivos no triviales); T4 → checks del orquestador (inline, 1-3 archivos de verificación). Sin commits (no pedido).
- PENDIENTE (verificación humana): recorrido en browser con sesión para confirmar visualmente counts reales, toggle Editar perfil y composición desktop/mobile (los datos/counts provienen del RPC ya smoke-testeado en Ronda 2; la lógica es idéntica a /users/[id]).