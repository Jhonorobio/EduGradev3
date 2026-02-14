-- Crear tabla para grados
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar tabla existente si existe (para recrear con nueva estructura)
DROP TABLE IF EXISTS grades CASCADE;

-- 2. Crear la tabla grades simplificada
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Primaria', 'Bachillerato')),
    group_director TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear índices
CREATE INDEX grades_name_idx ON grades (name);
CREATE INDEX grades_level_idx ON grades (level);
CREATE INDEX grades_group_director_idx ON grades (group_director);

-- 4. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_grades_updated_at 
    BEFORE UPDATE ON grades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_grades_updated_at();

-- 5. Insertar datos de ejemplo
INSERT INTO grades (name, level, group_director)
VALUES 
    ('Primero de Primaria', 'Primaria', 'María González'),
    ('Segundo de Primaria', 'Primaria', 'Juan Pérez'),
    ('Tercero de Primaria', 'Primaria', 'Ana Martínez'),
    ('Primero de Bachillerato', 'Bachillerato', 'Carlos Rodríguez'),
    ('Segundo de Bachillerato', 'Bachillerato', 'Laura Sánchez'),
    ('Tercero de Bachillerato', 'Bachillerato', 'Roberto Díaz');

-- 6. Verificar que la tabla se creó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'grades' 
ORDER BY ordinal_position;

-- 7. Mostrar los datos insertados
SELECT 
    id, 
    name, 
    level,
    group_director
FROM grades 
ORDER BY level, name;
