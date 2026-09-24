-- =====================================================================
-- LOVI · Capa social — follows + acceso social mínimo y seguro
-- Migración 0004
--
-- QUÉ CAMBIA (resumen para revisión):
-- 1) NUEVA tabla follows (seguir/dejar de seguir) con RLS estricto.
-- 2) NUEVAS funciones públicas SECURITY DEFINER con allowlist EXACTA de
--    columnas: user_id, nombre, image, created_at. NUNCA seleccionan email.
--    profiles NO recibe ninguna política nueva: su RLS sigue owner-only.
-- 3) pets: política SELECT NUEVA solo para seguidores del dueño (row-level,
--    seguido-gated). No se tocan insert/update/delete (siguen owner-only).
-- 4) lovis: política SELECT NUEVA = propios (ya existente) + creador seguido.
-- 5) lovi_media: política SELECT NUEVA para media de lovis de seguidos.
-- 6) storage.objects: SELECT nuevo para objetos de seguidos en buckets
--    pets y lovi-media; avatares (profiles) legibles por cualquier
--    authenticated DENTRO de Lovi. Escrituras siguen owner-only.
--
-- NO se modifica nada de 0001/0002/0003. RLS sigue activo en todas las
-- tablas. Ninguna política permite leer/write perfiles ajenos completos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) FOLLOWS
-- ---------------------------------------------------------------------
CREATE TABLE public.follows (
    follower_user_id  uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
    following_user_id uuid NOT NULL REFERENCES public.profiles (user_id) ON DELETE CASCADE,
    created_at        timestamptz NOT NULL DEFAULT now(),
    -- La PK compuesta garantiza que no exista el mismo follow duplicado.
    PRIMARY KEY (follower_user_id, following_user_id),
    -- Nadie puede seguirse a sí mismo.
    CONSTRAINT chk_follow_no_self CHECK (follower_user_id <> following_user_id)
);

COMMENT ON TABLE  public.follows IS 'Relación seguir/dejar de seguir entre usuarios de Lovi.';
COMMENT ON COLUMN public.follows.follower_user_id IS 'Quien sigue. PK parcial. RLS: solo el propio follower crea/borra su fila.';
COMMENT ON COLUMN public.follows.following_user_id IS 'A quien se sigue.';

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Índices: la PK ya cubre la búsqueda por follower (seguidos de X) y la
-- unicidad; este índice cubre la búsqueda por following (seguidores de X)
-- y su conteo; el de created_at ordena los feeds cronológicos.
CREATE INDEX idx_follows_following_user_id ON public.follows (following_user_id);
CREATE INDEX idx_follows_following_created  ON public.follows (following_user_id, created_at DESC);
CREATE INDEX idx_follows_follower_created   ON public.follows (follower_user_id, created_at DESC);

-- Sé lo que soy: solo puedo INSERT follows donde YO soy el follower.
CREATE POLICY "follows_insert_self_as_follower" ON public.follows
    FOR INSERT TO authenticated
    WITH CHECK (follower_user_id = auth.uid());

-- Solo puedo BORRAR follows donde YO soy el follower (nadie rompe tus follows).
CREATE POLICY "follows_delete_self_as_follower" ON public.follows
    FOR DELETE TO authenticated
    USING (follower_user_id = auth.uid());

-- SELECT de mis propias conexiones: mis seguidos (follower=auth.uid()) y
-- mis seguidores (following=auth.uid()). El resto de la red se accede por
-- las funciones públicas controladas de abajo.
CREATE POLICY "follows_select_own" ON public.follows
    FOR SELECT TO authenticated
    USING (follower_user_id = auth.uid() OR following_user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2) PERFIL PÚBLICO — funciones SECURITY DEFINER con allowlist SIN email
--    (profiles mantiene RLS owner-only: NO hay política nueva sobre la tabla)
-- ---------------------------------------------------------------------

-- Perfil público de un usuario (lo que cualquier autenticado puede ver).
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (user_id uuid, nombre text, image text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT profiles.user_id, profiles.nombre, profiles.image, profiles.created_at
    FROM public.profiles
    WHERE profiles.user_id = p_user_id;
$$;

-- Perfiles públicos en lote (para enriquecer un feed sin N+1).
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, nombre text, image text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT profiles.user_id, profiles.nombre, profiles.image, profiles.created_at
    FROM public.profiles
    WHERE profiles.user_id = ANY (p_user_ids);
$$;

-- Descubrir/buscar usuarios (search vacío = listar todos). Allowlist igual.
CREATE OR REPLACE FUNCTION public.search_public_users(p_query text)
RETURNS TABLE (user_id uuid, nombre text, image text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT profiles.user_id, profiles.nombre, profiles.image, profiles.created_at
    FROM public.profiles
    WHERE p_query = '' OR profiles.nombre ILIKE '%' || p_query || '%'
    ORDER BY profiles.nombre ASC
    LIMIT 50;
$$;

-- Counts eficientes (usan los índices de follows; sin barridos).
CREATE OR REPLACE FUNCTION public.get_follow_counts(p_user_id uuid)
RETURNS TABLE (followers_count bigint, following_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
      (SELECT count(*) FROM public.follows WHERE following_user_id = p_user_id),
      (SELECT count(*) FROM public.follows WHERE follower_user_id = p_user_id);
$$;

-- Lista de seguidores o seguidos con perfiles públicos + flag is_following
-- para el QUE LLAMA (p_direction: 'followers' | 'following').
-- El viewer NO se recibe como parámetro: se resuelve con auth.uid() para
-- que nadie pueda pasar un id ajeno y descubrir a quién sigue otra persona.
CREATE OR REPLACE FUNCTION public.get_follow_list(p_user_id uuid, p_direction text)
RETURNS TABLE (user_id uuid, nombre text, image text, is_following boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_viewer uuid := auth.uid();
BEGIN
    IF p_direction = 'following' THEN
        RETURN QUERY
        SELECT f.following_user_id, pr.nombre, pr.image,
               EXISTS (
                   SELECT 1 FROM public.follows v
                   WHERE v.follower_user_id = v_viewer
                     AND v.following_user_id = f.following_user_id
               )
        FROM public.follows f
        JOIN public.profiles pr ON pr.user_id = f.following_user_id
        WHERE f.follower_user_id = p_user_id
        ORDER BY f.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT f.follower_user_id, pr.nombre, pr.image,
               EXISTS (
                   SELECT 1 FROM public.follows v
                   WHERE v.follower_user_id = v_viewer
                     AND v.following_user_id = f.follower_user_id
               )
        FROM public.follows f
        JOIN public.profiles pr ON pr.user_id = f.follower_user_id
        WHERE f.following_user_id = p_user_id
        ORDER BY f.created_at DESC;
    END IF;
END;
$$;

-- Ejecución de las funciones solo para usuarios autenticados.
REVOKE ALL ON FUNCTION public.get_public_profile(uuid)    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_public_users(text)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_follow_counts(uuid)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_follow_list(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[])          TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_public_users(text)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_follow_counts(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_follow_list(uuid, text)          TO authenticated;

-- ---------------------------------------------------------------------
-- 3) PETS — lectura social mínima (follow-gated, row-level)
--    Un seguidor puede leer la fila de la mascota para identificar de qué
--    mascota es un Lovi del feed. Insert/update/delete siguen owner-only.
-- ---------------------------------------------------------------------
CREATE POLICY "pets_select_following" ON public.pets
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.follows
            WHERE follows.follower_user_id = auth.uid()
              AND follows.following_user_id = pets.user_id
        )
    );

-- ---------------------------------------------------------------------
-- 4) LOVIS — feed social = propios (política existente) + creador seguido
-- ---------------------------------------------------------------------
CREATE POLICY "lovis_select_following" ON public.lovis
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.follows
            WHERE follows.follower_user_id = auth.uid()
              AND follows.following_user_id = lovis.creator_user_id
        )
    );

-- ---------------------------------------------------------------------
-- 5) LOVI_MEDIA — media de lovis visibles en el feed social
-- ---------------------------------------------------------------------
CREATE POLICY "lovi_media_select_following" ON public.lovi_media
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.follows ON follows.follower_user_id = auth.uid()
                               AND follows.following_user_id = lovis.creator_user_id
            WHERE lovis.lovi_id = lovi_media.lovi_id
        )
    );

-- ---------------------------------------------------------------------
-- 6) STORAGE — lectura de objetos de usuarios seguidos + avatares
--    Solo SELECT; todas las escrituras siguen owner-only (0003 intacto).
-- ---------------------------------------------------------------------
CREATE POLICY "lovi_media_select_following_folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'lovi-media'
        AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE follows.follower_user_id = auth.uid()
              AND follows.following_user_id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "pets_select_following_folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'pets'
        AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE follows.follower_user_id = auth.uid()
              AND follows.following_user_id::text = (storage.foldername(name))[1]
        )
    );

-- Avatares: dentro de Lovi cualquier usuario autenticado puede ver avatares
-- (son el identificador público de la capa social). Nada más cambia.
CREATE POLICY "profiles_select_any_auth_folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] IS NOT NULL
    );