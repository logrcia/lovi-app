-- =====================================================================
-- LOVI · Registro médico — migración 0005
-- Vacunas con nota + tabla de estudios/controles. Independiente del
-- calendario y de los turnos.
-- =====================================================================

-- 1) Nota/observación opcional en vacunas
ALTER TABLE public.vaccines ADD COLUMN notes text;

COMMENT ON COLUMN public.vaccines.notes IS 'Nota u observación opcional de la vacuna.';

-- 2) pet_exams — estudios y controles de cada mascota
CREATE TABLE public.pet_exams (
    exam_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id     uuid NOT NULL REFERENCES public.pets (pet_id) ON DELETE CASCADE,
    name       text NOT NULL,
    exam_date  date NOT NULL,
    result     text,
    notes      text
);

COMMENT ON TABLE  public.pet_exams IS 'Estudios y controles médicos de una mascota. Independiente del calendario y de los turnos.';
COMMENT ON COLUMN public.pet_exams.pet_id IS 'FK -> pets. CASCADE: si la mascota se borra, se borran sus estudios.';
COMMENT ON COLUMN public.pet_exams.exam_date IS 'Fecha del estudio/control. Obligatoria.';
COMMENT ON COLUMN public.pet_exams.result IS 'Resultado o descripción del estudio (opcional).';
COMMENT ON COLUMN public.pet_exams.notes IS 'Nota u observación opcional.';

CREATE INDEX idx_pet_exams_pet_id ON public.pet_exams (pet_id);

ALTER TABLE public.pet_exams ENABLE ROW LEVEL SECURITY;

-- 3) RLS: solo dueño de la mascota (mismo patrón que vaccines, 0002)
CREATE POLICY "pet_exams_insert_own_pet" ON public.pet_exams
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = pet_exams.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "pet_exams_select_own_pet" ON public.pet_exams
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = pet_exams.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "pet_exams_update_own_pet" ON public.pet_exams
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = pet_exams.pet_id
              AND pets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = pet_exams.pet_id
              AND pets.user_id = auth.uid()
        )
    );

CREATE POLICY "pet_exams_delete_own_pet" ON public.pet_exams
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.pets
            WHERE pets.pet_id = pet_exams.pet_id
              AND pets.user_id = auth.uid()
        )
    );