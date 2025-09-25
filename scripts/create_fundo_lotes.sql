-- Crear tabla de Fundos (Farms)
CREATE TABLE public.fundos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  ubicacion text,
  area_hectareas decimal(10,2),
  responsable_id uuid,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fundos_pkey PRIMARY KEY (id),
  CONSTRAINT fundos_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);

-- Crear tabla de Lotes (Plots/Lots)
CREATE TABLE public.lotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_fundo uuid NOT NULL,
  nombre text NOT NULL,
  area_hectareas decimal(8,2),
  tipo_cultivo text,
  variedad text,
  fecha_siembra date,
  estado text DEFAULT 'activo' CHECK (estado = ANY (ARRAY['activo'::text, 'inactivo'::text, 'cosechado'::text])),
  responsable_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT lotes_pkey PRIMARY KEY (id),
  CONSTRAINT lotes_id_fundo_fkey FOREIGN KEY (id_fundo) REFERENCES public.fundos(id) ON DELETE CASCADE,
  CONSTRAINT lotes_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id),
  CONSTRAINT lotes_fundo_nombre_unique UNIQUE (id_fundo, nombre)
);

-- Crear tabla de permisos de módulos por usuario
CREATE TABLE public.user_module_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_name text NOT NULL,
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_module_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_module_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_module_permissions_unique UNIQUE (user_id, module_name)
);

-- Actualizar tablas existentes para relacionar con lotes
ALTER TABLE public.campo_recoleccion ADD COLUMN id_lote uuid;
ALTER TABLE public.campo_recoleccion ADD CONSTRAINT campo_recoleccion_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id);

ALTER TABLE public.acopio_recepcion ADD COLUMN id_lote uuid;
ALTER TABLE public.acopio_recepcion ADD CONSTRAINT acopio_recepcion_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id);

-- Insertar permisos por defecto para roles existentes
-- Admin: todos los módulos
INSERT INTO public.user_module_permissions (user_id, module_name, can_read, can_write, can_delete)
SELECT
  p.id,
  unnest(ARRAY['dashboard', 'admin', 'usuarios', 'camiones', 'guias', 'campo', 'acopio', 'packing', 'fundos', 'lotes']) as module_name,
  true, true, true
FROM public.profiles p
WHERE p.rol = 'admin';

-- Operador: todos menos admin
INSERT INTO public.user_module_permissions (user_id, module_name, can_read, can_write, can_delete)
SELECT
  p.id,
  unnest(ARRAY['dashboard', 'camiones', 'guias', 'campo', 'acopio', 'packing', 'fundos', 'lotes']) as module_name,
  true, true, true
FROM public.profiles p
WHERE p.rol = 'operador';

-- Usuario: solo dashboard y guias
INSERT INTO public.user_module_permissions (user_id, module_name, can_read, can_write, can_delete)
SELECT
  p.id,
  unnest(ARRAY['dashboard', 'guias']) as module_name,
  true, false, false
FROM public.profiles p
WHERE p.rol = 'usuario';

-- Crear índices para mejor rendimiento
CREATE INDEX idx_lotes_id_fundo ON public.lotes(id_fundo);
CREATE INDEX idx_user_module_permissions_user_id ON public.user_module_permissions(user_id);
CREATE INDEX idx_campo_recoleccion_id_lote ON public.campo_recoleccion(id_lote);
CREATE INDEX idx_acopio_recepcion_id_lote ON public.acopio_recepcion(id_lote);
