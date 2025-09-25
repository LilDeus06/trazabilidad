-- Crear tabla para permisos de usuario por fundo
CREATE TABLE IF NOT EXISTS user_fundo_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fundo_id UUID NOT NULL REFERENCES fundos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, fundo_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_fundo_permissions_user_id ON user_fundo_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fundo_permissions_fundo_id ON user_fundo_permissions(fundo_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE user_fundo_permissions ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios permisos
CREATE POLICY "Users can view their own fundo permissions" ON user_fundo_permissions
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los admins puedan ver todos los permisos
CREATE POLICY "Admins can view all fundo permissions" ON user_fundo_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.rol = 'admin'
        )
    );

-- Insertar algunos permisos de ejemplo si no existen
-- Nota: Esto requiere que existan usuarios y fundos en las tablas correspondientes
-- Los permisos se crearán automáticamente al crear usuarios desde el modal
