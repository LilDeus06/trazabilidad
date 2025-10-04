-- Actualizar políticas RLS para la tabla camiones
-- Para permitir que usuarios con permisos específicos puedan crear/editar camiones

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Solo admins pueden insertar camiones" ON public.camiones;
DROP POLICY IF EXISTS "Solo admins pueden actualizar camiones" ON public.camiones;
DROP POLICY IF EXISTS "Solo admins pueden eliminar camiones" ON public.camiones;

-- Nueva política para insertar camiones
-- Permite insertar si el usuario es admin O tiene permiso de escritura en el módulo camiones
CREATE POLICY "Usuarios autorizados pueden insertar camiones"
  ON public.camiones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_module_permissions
      WHERE user_id = auth.uid()
        AND module_name = 'camiones'
        AND can_write = true
    )
  );

-- Nueva política para actualizar camiones
-- Permite actualizar si el usuario es admin O tiene permiso de escritura en el módulo camiones
CREATE POLICY "Usuarios autorizados pueden actualizar camiones"
  ON public.camiones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_module_permissions
      WHERE user_id = auth.uid()
        AND module_name = 'camiones'
        AND can_write = true
    )
  );

-- Nueva política para eliminar camiones
-- Solo admins pueden eliminar (por seguridad)
CREATE POLICY "Solo admins pueden eliminar camiones"
  ON public.camiones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Verificar que las políticas estén activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'camiones'
ORDER BY policyname;
