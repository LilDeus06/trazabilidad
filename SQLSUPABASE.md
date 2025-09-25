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
  CONSTRAINT acopio_recepcion_pkey PRIMARY KEY (id),
  CONSTRAINT acopio_recepcion_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);
CREATE TABLE public.camiones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chofer text NOT NULL,
  placa text NOT NULL UNIQUE,
  capacidad integer NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT camiones_pkey PRIMARY KEY (id)
);
CREATE TABLE public.campo_carreta (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_recoleccion uuid,
  numero_carreta text NOT NULL,
  capacidad integer NOT NULL,
  estado text DEFAULT 'disponible'::text CHECK (estado = ANY (ARRAY['disponible'::text, 'en_uso'::text, 'mantenimiento'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT campo_carreta_pkey PRIMARY KEY (id),
  CONSTRAINT campo_carreta_id_recoleccion_fkey FOREIGN KEY (id_recoleccion) REFERENCES public.campo_recoleccion(id)
);
CREATE TABLE public.campo_recoleccion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  lote text NOT NULL,
  cantidad_recolectada integer NOT NULL,
  calidad text,
  responsable_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT campo_recoleccion_pkey PRIMARY KEY (id),
  CONSTRAINT campo_recoleccion_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES auth.users(id)
);
CREATE TABLE public.guias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_hora timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  id_camion uuid NOT NULL,
  enviadas integer NOT NULL DEFAULT 0,
  guias text NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT guias_pkey PRIMARY KEY (id),
  CONSTRAINT guias_id_camion_fkey FOREIGN KEY (id_camion) REFERENCES public.camiones(id),
  CONSTRAINT guias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
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
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  rol text,
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);