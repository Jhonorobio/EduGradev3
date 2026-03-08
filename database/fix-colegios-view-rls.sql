-- Fix RLS to allow viewing all active colleges when assigning to users
-- Add policy for admins/superadmins to view all active colleges

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Teachers can view assigned active colegios" ON colegios;

-- Create a more permissive policy for viewing active colleges
-- Allow authenticated users to view all active colleges (for assignment purposes)
CREATE POLICY "Authenticated users can view active colleges" ON colegios
    FOR SELECT USING (
        status = 'active'
    );

-- Keep the super admin policy for full access
DROP POLICY IF EXISTS "Super admins can view all colegios" ON colegios;
CREATE POLICY "Super admins can view all colegios" ON colegios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'SUPER_ADMIN'
        )
    );

-- Keep admin update policy
DROP POLICY IF EXISTS "Colegio admins can update colegios" ON colegios;
CREATE POLICY "Colegio admins can update their own colleges" ON colegios
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
