-- Crear tabla para configuraciones académicas
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear la tabla settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_count INTEGER NOT NULL DEFAULT 3 CHECK (period_count >= 2 AND period_count <= 4),
    period_weights JSONB NOT NULL DEFAULT '{"1": 30, "2": 30, "3": 40}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índice único para garantizar una sola fila (usando un identificador fijo)
CREATE UNIQUE INDEX IF NOT EXISTS settings_single_row_idx ON settings ((id IS NOT NULL));

-- 3. Insertar configuración por defecto si no existe
INSERT INTO settings (id, period_count, period_weights)
VALUES (gen_random_uuid(), 3, '{"1": 30, "2": 30, "3": 40}')
ON CONFLICT DO NOTHING;

-- 4. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Verificar que la tabla se creó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position;
