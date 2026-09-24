-- =====================================================================
-- LOVI · Seguridad — RLS + políticas + trigger de perfil
-- Migración 0002
--
-- Modelo de acceso: SOLO DUEÑO DE LA MASCOTA.
-- Aunque lovis.creator_user_id exista, ser el creador NO otorga permisos
-- adicionales: todo se valida contra pets.user_id = auth.uid().
-- (Colaboradores / co-creadores se agregan en una migración futura.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Habilitar RLS en todas las tablas
--    RLS bloquea por defecto: sin política, nadie (ni el cliente) puede
--    leer ni escribir. Cada tabla requiere políticas explícitas.
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lovis        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lovi_media   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_lovis  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 1) PROFILES
--    Solo lectura y edición del propio perfil.
--    NO hay política de INSERT a propósito: la creación de la fila es
--    exclusiva del trigger handle_new_user (SECURITY DEFINER, más abajo).
--    Así se garantiza la relación 1:1 con auth.users.
-- =====================================================================
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- 2) PETS
--    CRUD completo, siempre sobre pets.user_id = auth.uid().
--    El WITH CHECK del UPDATE evita "transferir" la mascota a otro usuario.
-- =====================================================================
CREATE POLICY "pets_insert_own" ON public.pets
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "pets_select_own" ON public.pets
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "pets_update_own" ON public.pets
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "pets_delete_own" ON public.pets
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================================
-- 3) LOVIS
--    INSERT: creator_user_id DEBE ser auth.uid() Y la mascota debe ser
--    propia (pets.user_id = auth.uid()).
--    SELECT/UPDATE/DELETE: solo si la mascota del lovi es propia.
--    Nota: NO se usa creator_user_id como condición de acceso. El creador
--    de un lovi sobre una mascota ajena NO obtiene permisos por eso.
-- =====================================================================
CREATE POLICY "lovis_insert_own_pet" ON public.lovis
    FOR INSERT TO authenticated
    WITH CHECK (
        creator_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = lovis.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "lovis_select_own_pet" ON public.lovis
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = lovis.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "lovis_update_own_pet" ON public.lovis
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = lovis.pet_id
              AND pets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        creator_user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = lovis.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "lovis_delete_own_pet" ON public.lovis
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = lovis.pet_id
              AND pets.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 4) LOVI_MEDIA
--    Acceso al media solo si el lovi pertenece a una mascota propia.
--    (Lovis y pets ya tienen RLS: los subqueries las re-validan.)
-- =====================================================================
CREATE POLICY "lovi_media_insert_own_pet" ON public.lovi_media
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = lovi_media.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "lovi_media_select_own_pet" ON public.lovi_media
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = lovi_media.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "lovi_media_update_own_pet" ON public.lovi_media
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = lovi_media.lovi_id
              AND pets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = lovi_media.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "lovi_media_delete_own_pet" ON public.lovi_media
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = lovi_media.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 5) ALBUMS
--    No tiene user_id propio: la propiedad se resuelve por su mascota.
-- =====================================================================
CREATE POLICY "albums_insert_own_pet" ON public.albums
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = albums.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "albums_select_own_pet" ON public.albums
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = albums.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "albums_update_own_pet" ON public.albums
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = albums.pet_id
              AND pets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = albums.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "albums_delete_own_pet" ON public.albums
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = albums.pet_id
              AND pets.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 6) ALBUM_LOVIS  (N:M albums <-> lovis)
--    Para gestionar la relación, AMBOS extremos deben pertenecer a
--    mascotas propias: el album Y el lovi.
--    UPDATE usa USING (fila vieja) + WITH CHECK (fila nueva) para que
--    tampoco se pueda re-apuntar hacia extremos ajenos.
-- =====================================================================
CREATE POLICY "album_lovis_insert_own_pet" ON public.album_lovis
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.albums
            JOIN public.pets ON pets.pet_id = albums.pet_id
            WHERE albums.album_id = album_lovis.album_id
              AND pets.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = album_lovis.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "album_lovis_select_own_pet" ON public.album_lovis
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.albums
            JOIN public.pets ON pets.pet_id = albums.pet_id
            WHERE albums.album_id = album_lovis.album_id
              AND pets.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = album_lovis.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "album_lovis_update_own_pet" ON public.album_lovis
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.albums
            JOIN public.pets ON pets.pet_id = albums.pet_id
            WHERE albums.album_id = album_lovis.album_id
              AND pets.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = album_lovis.lovi_id
              AND pets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.albums
            JOIN public.pets ON pets.pet_id = albums.pet_id
            WHERE albums.album_id = album_lovis.album_id
              AND pets.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = album_lovis.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "album_lovis_delete_own_pet" ON public.album_lovis
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.albums
            JOIN public.pets ON pets.pet_id = albums.pet_id
            WHERE albums.album_id = album_lovis.album_id
              AND pets.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1
            FROM public.lovis
            JOIN public.pets ON pets.pet_id = lovis.pet_id
            WHERE lovis.lovi_id = album_lovis.lovi_id
              AND pets.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 7) VACCINES
-- =====================================================================
CREATE POLICY "vaccines_insert_own_pet" ON public.vaccines
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = vaccines.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "vaccines_select_own_pet" ON public.vaccines
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = vaccines.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "vaccines_update_own_pet" ON public.vaccines
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = vaccines.pet_id
              AND pets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = vaccines.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "vaccines_delete_own_pet" ON public.vaccines
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = vaccines.pet_id
              AND pets.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 8) APPOINTMENTS
-- =====================================================================
CREATE POLICY "appointments_insert_own_pet" ON public.appointments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = appointments.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "appointments_select_own_pet" ON public.appointments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = appointments.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "appointments_update_own_pet" ON public.appointments
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = appointments.pet_id
              AND pets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = appointments.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "appointments_delete_own_pet" ON public.appointments
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = appointments.pet_id
              AND pets.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 9) TRIGGER: auto-creación de profiles al registrarse
--    SECURITY DEFINER: corre con los privilegios del dueño de la función
--    (postgres), para poder insertar el profile aunque RLS esté activo.
--    SET search_path = '': evita hijack de la ruta de búsqueda al
--    llamarse desde auth.users.
--    Nombre: prioridad raw_user_meta_data.nombre -> raw_user_meta_data.name
--    -> local-part del email (ej: ana@x.com -> ana).
--    Asumimos autenticación por email para este MVP.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nombre, email, image)
    VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data ->> 'nombre',
            new.raw_user_meta_data ->> 'name',
            split_part(new.email, '@', 1)
        ),
        new.email,
        new.raw_user_meta_data ->> 'image'
    );
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
