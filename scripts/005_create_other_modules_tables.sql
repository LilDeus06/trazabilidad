-- Crear tablas para otros módulos (preparadas para futuro desarrollo)

-- Tabla Campo - Recolección
create table if not exists public.campo_recoleccion (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  lote text not null,
  cantidad_recolectada integer not null,
  calidad text,
  responsable_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla Campo - Carreta
create table if not exists public.campo_carreta (
  id uuid primary key default gen_random_uuid(),
  id_recoleccion uuid references public.campo_recoleccion(id),
  numero_carreta text not null,
  capacidad integer not null,
  estado text default 'disponible' check (estado in ('disponible', 'en_uso', 'mantenimiento')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla Acopio - Recepción
create table if not exists public.acopio_recepcion (
  id uuid primary key default gen_random_uuid(),
  fecha_recepcion timestamp with time zone default timezone('utc'::text, now()) not null,
  procedencia text not null,
  cantidad_recibida integer not null,
  calidad text,
  responsable_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla Acopio - Pallets
create table if not exists public.acopio_pallets (
  id uuid primary key default gen_random_uuid(),
  codigo_pallet text not null unique,
  capacidad integer not null,
  estado text default 'vacio' check (estado in ('vacio', 'parcial', 'lleno', 'despachado')),
  ubicacion text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla Acopio - Carga
create table if not exists public.acopio_carga (
  id uuid primary key default gen_random_uuid(),
  id_pallet uuid references public.acopio_pallets(id),
  id_recepcion uuid references public.acopio_recepcion(id),
  cantidad integer not null,
  fecha_carga timestamp with time zone default timezone('utc'::text, now()) not null,
  responsable_id uuid references auth.users(id)
);

-- Tabla Packing
create table if not exists public.packing (
  id uuid primary key default gen_random_uuid(),
  fecha_packing timestamp with time zone default timezone('utc'::text, now()) not null,
  id_pallet uuid references public.acopio_pallets(id),
  cantidad_procesada integer not null,
  tipo_empaque text not null,
  destino text,
  responsable_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para todas las tablas
alter table public.campo_recoleccion enable row level security;
alter table public.campo_carreta enable row level security;
alter table public.acopio_recepcion enable row level security;
alter table public.acopio_pallets enable row level security;
alter table public.acopio_carga enable row level security;
alter table public.packing enable row level security;

-- Políticas básicas (usuarios autenticados pueden ver, solo admins pueden modificar)
create policy "Usuarios autenticados pueden ver campo_recoleccion" on public.campo_recoleccion for select using (auth.uid() is not null);
create policy "Usuarios autenticados pueden ver campo_carreta" on public.campo_carreta for select using (auth.uid() is not null);
create policy "Usuarios autenticados pueden ver acopio_recepcion" on public.acopio_recepcion for select using (auth.uid() is not null);
create policy "Usuarios autenticados pueden ver acopio_pallets" on public.acopio_pallets for select using (auth.uid() is not null);
create policy "Usuarios autenticados pueden ver acopio_carga" on public.acopio_carga for select using (auth.uid() is not null);
create policy "Usuarios autenticados pueden ver packing" on public.packing for select using (auth.uid() is not null);
