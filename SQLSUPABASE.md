-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.acopio_carga (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_pallet uuid,
  id_recepcion uuid,
  cantidad integer NOT NULL,
  fecha_carga timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  responsable_id uuid,
  CONSTRAINT acopio_carga_pkey PRIMARY KEY (id),
  CONSTRAINT acopio_carga_id_pallet_fkey FOREIGN KEY (id_pallet) REFERENCES public.acopio_pallets(id),
  CONSTRAINT acopio_carga_id_recepcion_fkey FOREIGN KEY (id_recepcion) REFERENCES public.acopio_recepcion(id),
  CONSTRAINT acopio_carga_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);
CREATE TABLE public.acopio_pallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo_pallet text NOT NULL UNIQUE,
  capacidad integer NOT NULL,
  estado text DEFAULT 'vacio'::text CHECK (estado = ANY (ARRAY['vacio'::text, 'parcial'::text, 'lleno'::text, 'despachado'::text])),
  ubicacion text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT acopio_pallets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.acopio_recepcion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_recepcion timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  procedencia text NOT NULL,
  cantidad_recibida integer NOT NULL,
  calidad text,
  responsable_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id_lote uuid,
  CONSTRAINT acopio_recepcion_pkey PRIMARY KEY (id),
  CONSTRAINT acopio_recepcion_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id),
  CONSTRAINT acopio_recepcion_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id)
);
CREATE TABLE public.camiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chofer text NOT NULL,
  placa text NOT NULL UNIQUE,
  capacidad integer NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id_fundo uuid,
  id_lote uuid,
  CONSTRAINT camiones_pkey PRIMARY KEY (id),
  CONSTRAINT camiones_id_fundo_fkey FOREIGN KEY (id_fundo) REFERENCES public.fundos(id),
  CONSTRAINT camiones_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id)
);
CREATE TABLE public.campo_carreta (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_recoleccion uuid,
  nombre_carreta text NOT NULL,
  total integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  estado integer,
  CONSTRAINT campo_carreta_pkey PRIMARY KEY (id),
  CONSTRAINT campo_carreta_id_recoleccion_fkey FOREIGN KEY (id_recoleccion) REFERENCES public.campo_recoleccion(id)
);
CREATE TABLE public.campo_recoleccion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  lote text NOT NULL,
  total_jabas integer NOT NULL,
  cantidad_jabas text,
  responsable_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id_lote uuid,
  CONSTRAINT campo_recoleccion_pkey PRIMARY KEY (id),
  CONSTRAINT campo_recoleccion_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id),
  CONSTRAINT campo_recoleccion_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id)
);
CREATE TABLE public.fundos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  ubicacion text,
  area_hectareas numeric,
  responsable_id uuid,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fundos_pkey PRIMARY KEY (id),
  CONSTRAINT fundos_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);
CREATE TABLE public.guia_lotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  guia_id uuid NOT NULL,
  lote_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guia_lotes_pkey PRIMARY KEY (id),
  CONSTRAINT guia_lotes_guia_id_fkey FOREIGN KEY (guia_id) REFERENCES public.guias(id),
  CONSTRAINT guia_lotes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id)
);
CREATE TABLE public.guias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_hora timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id_camion uuid NOT NULL,
  enviadas integer NOT NULL DEFAULT 0,
  guias text NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id_fundo uuid NOT NULL,
  id_lotes ARRAY,
  CONSTRAINT guias_pkey PRIMARY KEY (id),
  CONSTRAINT guias_id_camion_fkey FOREIGN KEY (id_camion) REFERENCES public.camiones(id),
  CONSTRAINT guias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id),
  CONSTRAINT guias_id_fundo_fkey FOREIGN KEY (id_fundo) REFERENCES public.fundos(id)
);
CREATE TABLE public.jabas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  qr_code text NOT NULL UNIQUE,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  lote_id uuid,
  carreta_id uuid,
  responsable_id uuid NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT jabas_pkey PRIMARY KEY (id),
  CONSTRAINT jabas_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lotes(id),
  CONSTRAINT jabas_carreta_id_fkey FOREIGN KEY (carreta_id) REFERENCES public.campo_carreta(id),
  CONSTRAINT jabas_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);
CREATE TABLE public.lotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_fundo uuid NOT NULL,
  nombre text NOT NULL,
  area_hectareas numeric,
  tipo_cultivo text,
  variedad text,
  fecha_siembra date,
  estado text DEFAULT 'activo'::text CHECK (estado = ANY (ARRAY['activo'::text, 'inactivo'::text, 'cosechado'::text])),
  responsable_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT lotes_pkey PRIMARY KEY (id),
  CONSTRAINT lotes_id_fundo_fkey FOREIGN KEY (id_fundo) REFERENCES public.fundos(id),
  CONSTRAINT lotes_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);
CREATE TABLE public.packing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_packing timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id_pallet uuid,
  cantidad_procesada integer NOT NULL,
  tipo_empaque text NOT NULL,
  destino text,
  responsable_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT packing_pkey PRIMARY KEY (id),
  CONSTRAINT packing_id_pallet_fkey FOREIGN KEY (id_pallet) REFERENCES public.acopio_pallets(id),
  CONSTRAINT packing_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  rol text NOT NULL DEFAULT 'usuario'::text CHECK (rol = ANY (ARRAY['admin'::text, 'usuario'::text, 'operador'::text])),
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_fundo_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fundo_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_fundo_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_fundo_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_fundo_permissions_fundo_id_fkey FOREIGN KEY (fundo_id) REFERENCES public.fundos(id)
);
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
  CONSTRAINT user_module_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  rol text,
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);