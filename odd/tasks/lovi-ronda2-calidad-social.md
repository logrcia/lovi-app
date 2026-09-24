# Feature: lovi-ronda2-calidad-social

## Objective
Ronda de correcciones, mejoras UX y capa social sobre el MVP **ya implementado** de Lovi (no rehacer). Conservar todo lo que funciona, la dirección de arte actual y las migraciones ya aplicadas.

## Problem / Why
- Bug: al crear un segundo Lovi el formulario conserva estado del anterior (files, título, pet, uploaded, isSubmitting; object URLs sin revocar).
- Warnings: Node 20 (supabase-js exige >=22) y "uncached data during prerendering" en /pets, /loviar, /calendar, /profile, /pets/[id] (Next 16.3 + cacheComponents).
- UX: perfil de mascota con foto dominante/overlap, accesos no visibles sin scroll; "Recuerdos" apunta a crear en vez de listar.
- Nueva capa social: followers/following, perfiles públicos seguros (sin email), feed propio + seguidos.

## Scope / Constraints
- NO modificar `0001_init.sql`, `0002_security.sql`, `0003_storage.sql`. Migración nueva = `0004_*.sql`.
- NO hacer `db push` de migración nueva sin confirmación explícita del usuario (0003 tampoco está aplicada al remoto).
- NO desactivar RLS. NO `SELECT global` de profiles (protege `email`).
- NO implementar: likes, comentarios, chat, solicitudes de follow, cuentas privadas, notificaciones, algoritmo, publicidad, stories, reposts.
- NO `use cache` sobre queries dependientes del usuario.
- No commitear sin pedido explícito (historial: repo con MVP sin commitear).
- Orden obligatorio: FASE A -> B -> C -> D -> E.

## Authorized scope
Fases A-E tal como pidió el usuario. Cada trabajo unit se implementa con la topología más chica (inline o writer delegado según triggers).

## Tasks
- [ ] T1 (FASE A) Node 22+: `.nvmrc`, `engines.node`, `@types/node ^22`, runtime local a Node 22 LTS, reinstalar y verificar warning de supabase-jS eliminado
- [ ] T2 (FASE A) Prerender: `export const instant = false` por página del grupo (app) que lee Supabase; `generateMetadata` de /pets/[id] sin query duplicada (metadata estática "Mascota · Lovi"); sin "use cache" global
- [ ] T3 (FASE A) Performance obvia: `attachMedia` firma en paralelo (Promise.all), `getMonthCalendarMarks` consultas en paralelo, revisar duplicados metadata+page
- [ ] T4 (FASE A) Verificación: `npm run lint`, `npx tsc --noEmit`, `npm run build` limpios
- [ ] T5 (FASE B) Reset real del formulario Loviar: limpiar title/description/petId/files/uploaded/error/isSubmitting, revocar object URLs (éxito y removeFile), no reutilizar uploads previos; no duplicar el Lovi
- [x] T6 (FASE B) Revisar upload/previews y confirmar segundo Lovi limpio — confirmado por el usuario en navegador ("el formulario arranca limpio")
- [ ] T7 (FASE C) Perfil mascota: header compacto (eyebrow "Mi mascota" chico, foto 180-240px desktop responsive, nombre/especie/edad/descripción/Editar jerarquizados, sin overlap); 4 accesos (Recuerdos, Álbumes, Vacunas, Turnos) visibles en primer viewport desktop
- [ ] T8 (FASE C) Sección Recuerdos de mascota: nueva vista `/pets/[id]/memories` listando lovis de esa mascota (reciente->antiguo, multimedia, título, descripción, fecha), empty state "Todavía no hay recuerdos con [nombre]" + CTA "Loviar el primero"; CTA "+ Loviar recuerdo" -> `/loviar?pet=[id]` (mascota preseleccionada); desvincular "Recuerdos" de la creación
- [x] T9 (FASE D) Modelo seguro + migración 0004: tabla `follows` (PK follower+following, CHECK no self-follow, índices, RLS insert/delete solo como follower, select acotado) + funciones SECURITY DEFINER públicas (user_id, nombre, image, created_at — NUNCA email) + políticas SELECT social mínimas en pets/lovis/lovi_media + storage (avatars, pet images y lovi-media de seguidos). Diseño aprobado por el usuario; migración escrita. PENDIENTE: db push con confirmación explícita (0003 tampoco aplicada).
- [x] T10 (FASE D) Usuarios: descubrir/buscar usuarios, perfil social (nombre, avatar, mascotas visibles, counts, botón Seguir/Siguiendo, lovis compartibles), sin email
- [x] T11 (FASE D) Follow/unfollow + listas seguidores/seguidos con avatares y botón contextual
- [x] T12 (FASE D) Home/feed social: propios + seguidos cronológico, avatar/usuario/mascota/fecha/multimedia, empty state "Seguí a otros amantes de mascotas..." + CTA "Descubrir usuarios"
- [x] T13 (FASE D) Navegación: accesos claros a Inicio, Loviar, Mis mascotas, Usuarios, Calendario, Perfil; responsive, sin sobrecargar
- [x] T14 (FASE E) Lint + TS + build ✅ | smoke rutas sin sesión (8 protegidas 307 -> /auth/login, 3 públicas 200) ✅ | smoke rutas con sesión (feed, users, users/[id], calendar, profile, loviar, pets/new: 200) ✅ | test A/B 2 usuarios + RLS: 25/25 PASS (usuarios lovi-e2e-a/b@lovi.dev creados auto-confirmados; 1 "FAIL" inicial = bug de assertion del script — RPC devuelve tabla, se accedía .followers_count sobre array; corregido, re-run 25/25) ✅ | FIX FollowButton (closure inline → bind) ✅ | **recorrido manual en navegador CONFIRMADO por el usuario: todos los pasos OK**. NOTA: notFound() en pets/[id] y users/[id] renderiza bien la UI 404 pero Next 16 devuelve status HTTP 200 por streaming con instant=false (known nuance, no bloquea).

## Acceptance Criteria
Según #20 del pedido: Loviar limpio para segundo uso; perfil sin overlaps y con accesos visibles en desktop; Recuerdos lista vs crear diferenciados; social completo (descubrir, seguir/dejar, counts, feed) sin exponer emails; Node soportado sin warning; sin "uncached data"; TS y build OK; RLS protegida.

## Verification (per phase)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Test social conceptual con 2 usuarios antes de dar FASE D por cerrada.

## Progress
- Auditoría inicial completa: ver respuestas 1-6 al usuario (causa Loviar = estado sin reset; prerender = falta `instant=false` por página; perfil = header no compacto + Recuerdos apuntando a /loviar; migración 0004 follows + funciones públicas; feed vía RLS seguidos + funciones SECURITY DEFINER sin email; 0004 es la próxima).
- Versiones: node 20.17.0, Next 16.3.0 (cacheComponents), @supabase/supabase-js 2.112.3, @supabase/ssr 0.12.4, React 19.2.8, supabase CLI global 2.117.0.
- CORRECCIÓN (verificada con `supabase migration list --linked --output-format json`): 0003 SÍ está aplicada en el remoto (igual que 0001 y 0002). La nota anterior "0003 NO aplicada" era del momento del audit, antes de que el usuario corriera `supabase db push --linked`. Única migración pendiente: 0004 (dry-run lo confirma).
- MVP completo sin commitear (historial: commit inicial scaffold). No se commitea sin pedido.
- FASE A (T1-T4): ✅ COMPLETA. Node 22.23.3 LTS global vía Homebrew (opción elegida por usuario: brew link --overwrite node@22). npm install limpio, supabase-js sin warning de Node. `.nvmrc`=22, engines.node >=22.0.0, @types/node ^22. `export const instant = false` en 13 páginas (incl. home `/`). generateMetadata de /pets/[id] estática ("Mascota · Lovi") sin query. attachMedia + getMonthCalendarMarks paralelizados. lint 0 errores (1 warning preexistente img en media-item), tsc OK, build OK sin "uncached data".
- FASE B (T5): ✅ código completo. lovi-form: resetForm total (title/description/petId/files/uploaded/error/isSubmitting), revokePreviews en éxito y en removeFile, guard anti doble-submit, fix bug preexistente de botón trabado si falla una subida (setIsSubmitting(false) en el return temprano). tsc/lint OK. Falta prueba manual de los 2 Lovis consecutivos (T6 — usuario).
- FASE C (T7-T8): ✅ COMPLETA. Header compacto en card-lovi (foto h-44 w-44=176px mobile / sm:h-48 w-48=192px desktop, sin overlap, sticker "mi mascota", nombre/especie/edad/descripción line-clamp-2, Editar a la derecha), tarjetas compactas (gap-3 px-4 py-4 mb-6). NUEVA ruta /pets/[id]/memories (instant=false, notFound, empty state "Todavía no hay recuerdos con {nombre}" + CTA "Loviar el primero", lista LoviCard showPet=false canDelete, CTA "+ Loviar recuerdo"). SECTIONS "lovis" de pets/[id] apunta a memories. /loviar?pet= preselecciona (validado contra pets del usuario). createLovi/deleteLovi revalidan memories (deleteLovi lee pet_id de lovis porque lovi_media NO tiene pet_id — corrección de schema del writer). tsc/lint/build OK.
- FASE D: ✅ COMPLETA (T9-T13). Diseño 0004 aprobado por el usuario (± calendario privado). Migración `0004_follows_social.sql` escrita (seguridad: get_follow_list resuelve viewer con auth.uid() — sin parámetro audible; follows calificado como public.* en storage policies). Implementación: toggleFollow action, RPC helpers tipados (SIN email, nunca .from("profiles")), /users (búsqueda + seguir), /users/[id] (perfil público: notFound, counts, tabs, pets visibles, lovis), feed home con atribución creator + empty states (seguís a nadie vs no hay recuerdos), calandario privado (filtros ownership en getMonthCalendarMarks/getDayLovis/getDayBirthdays), nav con "Usuarios". Verificación: lint 0 errores (1 warning preexistente), tsc exit 0, build exit 0, verificador independiente 7/7 PASS (fixeado typo `seguiendo`→`siguiendo` y copy empty state). **db push 0004 EJECUTADO con confirmación explícita del usuario: `supabase db push --linked` aplicó 0004 al remoto (verificado: 0001-0004 todas en remote).**
- FASE E: ✅ COMPLETA (T14). lint/TS/build ✅, smoke rutas sin/con sesión ✅, test A/B 2 usuarios + RLS 25/25 ✅, fix FollowButton (closure inline → `toggleFollow.bind(null, id)`, action `Promise<void>`) ✅, recorrido manual en navegador confirmado por el usuario ✅. Ronda 2 COMPLETA. Queda decisión del usuario: commit del MVP (work-unit) — trabajo sin commitear.

## Resolved during implementation
- (pendiente completar)