-- =====================================================================
-- LOVI · Storage — buckets + políticas owner-only
-- Migración 0003
--
-- Crea los buckets privados que el frontend ya referencia
-- (PETS_BUCKET = "pets", LOVI_MEDIA_BUCKET = "lovi-media") y agrega un
-- bucket para imágenes de perfil (profiles.image).
--
-- Modelo de acceso: MISMO modelo owner-only que 0002.
-- Cada objeto vive bajo una carpeta que empieza por el user_id:
--   pets/{user_id}/...
--   lovi-media/{user_id}/...
--   profiles/{user_id}/...
-- Las políticas solo permiten operar sobre la carpeta propia.
-- Los buckets son PRIVADOS (public = false): todo consumo pasa por URLs
-- firmadas (lib/media.ts). NO se usa service role en el frontend.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Crear buckets (privados). ON CONFLICT: idempotente ante re-runs.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('pets', 'pets', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('lovi-media', 'lovi-media', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2) Políticas por bucket. Cada archivo debe estar dentro de la carpeta
--    del usuario autenticado: (storage.foldername(name))[1] = auth.uid().
-- ---------------------------------------------------------------------

-- =====================================================================
-- BUCKET: pets
-- =====================================================================
CREATE POLICY "pets_select_own_folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'pets'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "pets_insert_own_folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'pets'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "pets_update_own_folder" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'pets'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'pets'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "pets_delete_own_folder" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'pets'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================================
-- BUCKET: lovi-media
-- =====================================================================
CREATE POLICY "lovi_media_select_own_folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'lovi-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "lovi_media_insert_own_folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'lovi-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "lovi_media_update_own_folder" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'lovi-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'lovi-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "lovi_media_delete_own_folder" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'lovi-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================================
-- BUCKET: profiles
-- =====================================================================
CREATE POLICY "profiles_select_own_folder" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "profiles_insert_own_folder" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "profiles_update_own_folder" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "profiles_delete_own_folder" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'profiles'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================================
-- Notas
-- - Las URLs firmadas (createSignedUrl) devuelven acceso acotado al
--   propietario; los buckets no son públicos.
-- - La carpeta {user_id} la arma el cliente al subir (lib/storage.ts);
--   nunca se construye con datos del usuario sin sanitizar.
-- - limpieza: al borrar pets/lovis la app borra los archivos asociados
--   usando el mismo cliente autenticado del usuario.
-- =====================================================================