-- Crear tabla de camiones
create table if not exists public.camiones (
  id uuid primary key default gen_random_uuid(),
  chofer text not null,
  placa text not null unique,
  capacidad integer not null,
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.camiones enable row level security;

-- Políticas para camiones - solo usuarios autenticados pueden ver
create policy "Usuarios autenticados pueden ver camiones"
  on public.camiones for select
  using (auth.uid() is not null);

-- Solo admins pueden modificar camiones
create policy "Solo admins pueden insertar camiones"
  on public.camiones for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Solo admins pueden actualizar camiones"
  on public.camiones for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Solo admins pueden eliminar camiones"
  on public.camiones for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );
