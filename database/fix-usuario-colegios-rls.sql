-- Fix RLS policies for usuario_colegios table
-- This script enables teachers to see their assigned colegios

-- First, enable RLS on table if not already enabled
ALTER TABLE usuario_colegios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their colegios" ON usuario_colegios;
DROP POLICY IF EXISTS "Users can insert usuario_colegios" ON usuario_colegios;
DROP POLICY IF EXISTS "Users can update usuario_colegios" ON usuario_colegios;
DROP POLICY IF EXISTS "Users can delete usuario_colegios" ON usuario_colegios;

-- Create policy for viewing usuario_colegios
-- Users can view their own colegio assignments
CREATE POLICY "Users can view their colegios" ON usuario_colegios
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy for inserting usuario_colegios
-- Only authenticated users can insert their own colegio assignments
CREATE POLICY "Users can insert usuario_colegios" ON usuario_colegios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for updating usuario_colegios
-- Users can update their own colegio assignments
CREATE POLICY "Users can update usuario_colegios" ON usuario_colegios
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for deleting usuario_colegios
-- Users can delete their own colegio assignments
CREATE POLICY "Users can delete usuario_colegios" ON usuario_colegios
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON usuario_colegios TO authenticated;
GRANT ALL ON usuario_colegios TO service_role;

-- Also, ensure colegios table has proper RLS policies for teachers
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;

-- Drop existing colegios policies if they exist
DROP POLICY IF EXISTS "Users can view colegios" ON colegios;
DROP POLICY IF EXISTS "Teachers can view assigned colegios" ON colegios;
DROP POLICY IF EXISTS "Admins can view all colegios" ON colegios;
DROP POLICY IF EXISTS "Super admins can update colegios" ON colegios;
DROP POLICY IF EXISTS "Colegio admins can update colegios" ON colegios;

-- Create policy for viewing active colegios through usuario_colegios relationship
-- This allows teachers to see only active colegios they are assigned to
CREATE POLICY "Teachers can view assigned active colegios" ON colegios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuario_colegios 
            WHERE usuario_colegios.colegio_id = colegios.id 
            AND usuario_colegios.user_id = auth.uid()
        )
        AND colegios.status = 'active'
    );

-- Create policy for super admins to see all colegios
CREATE POLICY "Super admins can view all colegios" ON colegios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Create policy for super admins to update all colegios
CREATE POLICY "Super admins can update colegios" ON colegios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Create policy for colegio admins to update their colegios
CREATE POLICY "Colegio admins can update colegios" ON colegios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuario_colegios 
            WHERE usuario_colegios.colegio_id = colegios.id 
            AND usuario_colegios.user_id = auth.uid()
            AND usuario_colegios.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuario_colegios 
            WHERE usuario_colegios.colegio_id = colegios.id 
            AND usuario_colegios.user_id = auth.uid()
            AND usuario_colegios.role = 'admin'
        )
    );

-- Grant permissions on colegios table
GRANT ALL ON colegios TO authenticated;
GRANT ALL ON colegios TO service_role;
