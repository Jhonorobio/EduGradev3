-- Crear tabla para materias
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar tabla existente si existe (para recrear con nueva estructura)
DROP TABLE IF EXISTS subjects CASCADE;

-- 2. Crear la tabla subjects con niveles múltiples
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    levels TEXT[] NOT NULL, -- Array de niveles: ['Primaria', 'Bachillerato']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validación: al menos un nivel requerido
    CONSTRAINT subjects_levels_not_empty CHECK (array_length(levels, 1) > 0),
    -- Validación: solo niveles permitidos
    CONSTRAINT subjects_valid_levels CHECK (
        levels <@ ARRAY['Primaria', 'Bachillerato']::TEXT[]
    )
);

-- 3. Crear índices
CREATE INDEX subjects_name_idx ON subjects (name);
CREATE INDEX subjects_code_idx ON subjects (code);
CREATE INDEX subjects_levels_idx ON subjects USING GIN (levels);

-- 4. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_subjects_updated_at();

-- 5. Insertar datos de ejemplo con niveles múltiples
INSERT INTO subjects (name, code, levels)
VALUES 
    ('Matemáticas', 'MAT101', ARRAY['Primaria', 'Bachillerato']),
    ('Español', 'ESP101', ARRAY['Primaria', 'Bachillerato']),
    ('Ciencias', 'CIE101', ARRAY['Primaria']),
    ('Historia', 'HIS101', ARRAY['Bachillerato']),
    ('Educación Física', 'EDF101', ARRAY['Primaria']),
    ('Filosofía', 'FIL101', ARRAY['Bachillerato']),
    ('Inglés', 'ING101', ARRAY['Primaria', 'Bachillerato']),
    ('Arte', 'ART101', ARRAY['Primaria']);

-- 6. Verificar que la tabla se creó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'subjects' 
ORDER BY ordinal_position;

-- 7. Mostrar los datos insertados
SELECT 
    id, 
    name, 
    code, 
    levels,
    array_to_string(levels, ', ') as levels_text
FROM subjects 
ORDER BY name;
