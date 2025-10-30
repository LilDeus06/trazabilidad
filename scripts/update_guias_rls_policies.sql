-- Update RLS policies for guias table to allow proper editing and deletion
-- This script should be run in your Supabase database

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver guías" ON public.guias;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar guías" ON public.guias;
DROP POLICY IF EXISTS "Solo admins pueden actualizar guías" ON public.guias;
DROP POLICY IF EXISTS "Solo admins pueden eliminar guías" ON public.guias;

-- Enable RLS (if not already enabled)
ALTER TABLE public.guias ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read guias
CREATE POLICY "Usuarios autenticados pueden ver guías"
  ON public.guias FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to insert guias
CREATE POLICY "Usuarios autenticados pueden insertar guías"
  ON public.guias FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Policy for users with write permissions to update guias
CREATE POLICY "Usuarios autorizados pueden actualizar guías"
  ON public.guias FOR UPDATE
  USING (
    -- Admin can update any guia
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
    OR
    -- Users with write permission on guias module can update
    EXISTS (
      SELECT 1 FROM public.user_module_permissions
      WHERE user_id = auth.uid()
        AND module_name = 'guias'
        AND can_write = true
    )
    OR
    -- Users who created the guia can update it
    auth.uid() = usuario_id
  );

-- Policy for users with delete permissions to delete guias
CREATE POLICY "Usuarios autorizados pueden eliminar guías"
  ON public.guias FOR DELETE
  USING (
    -- Admin can delete any guia
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
    OR
    -- Users with delete permission on guias module can delete
    EXISTS (
      SELECT 1 FROM public.user_module_permissions
      WHERE user_id = auth.uid()
        AND module_name = 'guias'
        AND can_delete = true
    )
  );
