-- Añadir campo avatar a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Actualizar la política de actualización para incluir avatar_url
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Comentario sobre el campo avatar
COMMENT ON COLUMN profiles.avatar_url IS 'URL del avatar del usuario almacenado en Vercel Blob';
