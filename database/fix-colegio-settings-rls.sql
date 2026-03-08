-- Fix RLS policies for colegio_settings table
-- This script enables users to create and update colegio settings

-- First, enable RLS on the table if not already enabled
ALTER TABLE colegio_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view colegio_settings" ON colegio_settings;
DROP POLICY IF EXISTS "Users can insert colegio_settings" ON colegio_settings;
DROP POLICY IF EXISTS "Users can update colegio_settings" ON colegio_settings;

-- Create policy for viewing colegio_settings
-- Users can view all colegio_settings (for now, we can restrict later)
CREATE POLICY "Users can view colegio_settings" ON colegio_settings
    FOR SELECT USING (true);

-- Create policy for inserting colegio_settings
-- Users can insert new colegio_settings
CREATE POLICY "Users can insert colegio_settings" ON colegio_settings
    FOR INSERT WITH CHECK (true);

-- Create policy for updating colegio_settings
-- Users can update any colegio_settings (for now, we can restrict later)
CREATE POLICY "Users can update colegio_settings" ON colegio_settings
    FOR UPDATE USING (true);

-- Create policy for deleting colegio_settings
-- Users can delete any colegio_settings (for now, we can restrict later)
CREATE POLICY "Users can delete colegio_settings" ON colegio_settings
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON colegio_settings TO authenticated;
GRANT ALL ON colegio_settings TO service_role;

-- Optional: More restrictive policies for production
-- Uncomment these for production use when you want to restrict access

-- Policy for viewing only colegio_settings for colegios the user belongs to
-- CREATE POLICY "Users can view their colegio_settings" ON colegio_settings
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM colegios 
--             WHERE colegios.id = colegio_settings.colegio_id
--             AND colegios.created_by = auth.uid()
--         )
--     );

-- Policy for inserting only colegio_settings for colegios the user belongs to
-- CREATE POLICY "Users can insert their colegio_settings" ON colegio_settings
--     FOR INSERT WITH CHECK (
--         EXISTS (
--             SELECT 1 FROM colegios 
--             WHERE colegios.id = colegio_settings.colegio_id
--             AND colegios.created_by = auth.uid()
--         )
--     );

-- Policy for updating only colegio_settings for colegios the user belongs to
-- CREATE POLICY "Users can update their colegio_settings" ON colegio_settings
--     FOR UPDATE USING (
--         EXISTS (
--             SELECT 1 FROM colegios 
--             WHERE colegios.id = colegio_settings.colegio_id
--             AND colegios.created_by = auth.uid()
--         )
--     );
