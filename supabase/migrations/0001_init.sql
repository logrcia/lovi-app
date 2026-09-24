-- =====================================================================
-- LOVI · Esquema relacional para Supabase / PostgreSQL
-- Migración 0001 — estructura inicial
-- RLS, triggers y demás lógica se agregan en migraciones posteriores.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles — relación 1:1 con auth.users
-- ---------------------------------------------------------------------
CREATE TABLE profiles (
    user_id    uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    nombre     text NOT NULL,
    email      text NOT NULL UNIQUE,
    image      text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  profiles IS 'Datos del usuario. 1:1 con auth.users.';
COMMENT ON COLUMN profiles.user_id IS 'PK = auth.users.id. Sin DEFAULT: el valor SIEMPRE es el id del usuario autenticado. CASCADE: borrar el usuario auth elimina su perfil.';
COMMENT ON COLUMN profiles.email IS 'ÚNICO: lookup rápido por email.';

-- ---------------------------------------------------------------------
-- 2) pets — cada mascota pertenece a un usuario (su dueño/a)
-- ---------------------------------------------------------------------
CREATE TABLE pets (
    pet_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES profiles (user_id) ON DELETE CASCADE,
    pet_name    text NOT NULL,
    especie     text NOT NULL,
    birth_date  date,
    image       text,
    description text
);

COMMENT ON TABLE  pets IS 'Mascotas del usuario. user_id es el DUEÑO de la mascota.';
COMMENT ON COLUMN pets.user_id IS 'FK -> profiles.user_id. Dueño/a de la mascota. CASCADE: si el usuario se borra, se borran sus mascotas.';
COMMENT ON COLUMN pets.especie IS 'Ej: perro, gato, pájaro...';

-- ---------------------------------------------------------------------
-- 3) lovis — recuerdos asociados a una mascota
-- ---------------------------------------------------------------------
CREATE TABLE lovis (
    lovi_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id uuid NOT NULL REFERENCES profiles (user_id) ON DELETE CASCADE,
    pet_id          uuid NOT NULL REFERENCES pets (pet_id) ON DELETE CASCADE,
    title           text NOT NULL,
    description     text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  lovis IS 'Recuerdos de mascotas.';
COMMENT ON COLUMN lovis.creator_user_id IS 'FK -> profiles.user_id. Usuario que CREÓ/PUBLICÓ el recuerdo. NO necesariamente igual a pets.user_id: la plataforma puede permitir que familiares o amigos autorizados publiquen recuerdos de una mascota ajena.';
COMMENT ON COLUMN lovis.pet_id IS 'FK -> pets.pet_id. CASCADE: si la mascota se borra, se borran sus recuerdos.';

-- ---------------------------------------------------------------------
-- 4) lovi_media — multimedia de cada recuerdo (1 lovi -> N media)
-- ---------------------------------------------------------------------
CREATE TABLE lovi_media (
    media_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lovi_id    uuid NOT NULL REFERENCES lovis (lovi_id) ON DELETE CASCADE,
    media_url  text NOT NULL,
    media_type text NOT NULL CONSTRAINT chk_media_type CHECK (media_type IN ('image', 'video', 'audio')),
    position   integer NOT NULL DEFAULT 0 CONSTRAINT chk_position_non_negative CHECK (position >= 0)
);

COMMENT ON TABLE  lovi_media IS 'Fotos/videos/audios de un recuerdo, ordenados por position.';
COMMENT ON COLUMN lovi_media.lovi_id IS 'FK -> lovis. CASCADE: borrar el recuerdo borra su media.';
COMMENT ON COLUMN lovi_media.media_type IS 'Solo image, video o audio (CHECK).';
COMMENT ON COLUMN lovi_media.position IS 'Orden de visualización (0 = primero).';

-- ---------------------------------------------------------------------
-- 5) albums — álbumes que agrupan recuerdos de una mascota
-- ---------------------------------------------------------------------
CREATE TABLE albums (
    album_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id      uuid NOT NULL REFERENCES pets (pet_id) ON DELETE CASCADE,
    title       text NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  albums IS 'Álbumes de una mascota.';
COMMENT ON COLUMN albums.pet_id IS 'FK -> pets. CASCADE: si la mascota se borra, se borran sus álbumes.';

-- ---------------------------------------------------------------------
-- 6) album_lovis — relación N:M entre álbumes y recuerdos
-- ---------------------------------------------------------------------
CREATE TABLE album_lovis (
    album_id uuid NOT NULL REFERENCES albums (album_id) ON DELETE CASCADE,
    lovi_id  uuid NOT NULL REFERENCES lovis (lovi_id) ON DELETE CASCADE,
    PRIMARY KEY (album_id, lovi_id)
);

COMMENT ON TABLE  album_lovis IS 'N:M entre albums y lovis. Un recuerdo puede estar en varios álbumes.';
COMMENT ON COLUMN album_lovis.album_id IS 'FK -> albums. CASCADE: borrar el álbum desvincula sus recuerdos.';
COMMENT ON COLUMN album_lovis.lovi_id IS 'FK -> lovis. CASCADE: borrar el recuerdo lo saca de todos los álbumes.';

-- ---------------------------------------------------------------------
-- 7) vaccines — vacunas de cada mascota
-- ---------------------------------------------------------------------
CREATE TABLE vaccines (
    vac_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id    uuid NOT NULL REFERENCES pets (pet_id) ON DELETE CASCADE,
    name      text NOT NULL,
    date      date NOT NULL,
    next_dose date,
    CONSTRAINT chk_next_dose_after_date CHECK (next_dose IS NULL OR next_dose >= date)
);

COMMENT ON TABLE  vaccines IS 'Vacunas de una mascota.';
COMMENT ON COLUMN vaccines.pet_id IS 'FK -> pets. CASCADE: si la mascota se borra, se borran sus vacunas.';
COMMENT ON COLUMN vaccines.date IS 'Fecha de la vacuna. Obligatoria.';
COMMENT ON COLUMN vaccines.next_dose IS 'Opcional; si existe, debe ser >= date (CHECK).';

-- ---------------------------------------------------------------------
-- 8) appointments — turnos / citas de cada mascota
-- ---------------------------------------------------------------------
CREATE TABLE appointments (
    ap_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id      uuid NOT NULL REFERENCES pets (pet_id) ON DELETE CASCADE,
    name        text NOT NULL,
    date        timestamptz NOT NULL,
    description text
);

COMMENT ON TABLE  appointments IS 'Turnos (veterinario, peluquería, etc.) de una mascota.';
COMMENT ON COLUMN appointments.pet_id IS 'FK -> pets. CASCADE: si la mascota se borra, se borran sus turnos.';
COMMENT ON COLUMN appointments.date IS 'Fecha y hora del turno. Obligatoria.';

-- =====================================================================
-- ÍNDICES
-- Las FKs en Postgres NO crean índices automáticamente: se necesitan
-- para joins y para que los ON DELETE CASCADE no escaneen tablas enteras.
-- =====================================================================
CREATE INDEX idx_pets_user_id            ON pets (user_id);
CREATE INDEX idx_lovis_creator_user_id   ON lovis (creator_user_id);
CREATE INDEX idx_lovis_pet_id            ON lovis (pet_id);
CREATE INDEX idx_lovi_media_lovi_id      ON lovi_media (lovi_id);
CREATE INDEX idx_albums_pet_id           ON albums (pet_id);
CREATE INDEX idx_album_lovis_lovi_id     ON album_lovis (lovi_id); -- la PK ya cubre búsquedas por album_id
CREATE INDEX idx_vaccines_pet_id         ON vaccines (pet_id);
CREATE INDEX idx_appointments_pet_id     ON appointments (pet_id);
