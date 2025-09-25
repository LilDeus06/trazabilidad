-- Crear tabla de perfiles de usuarios con roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  apellido text not null,
  rol text not null default 'usuario' check (rol in ('admin', 'usuario', 'operador')),
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas para perfiles
create policy "Los usuarios pueden ver su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Los usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Los admins pueden ver todos los perfiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Los admins pueden insertar perfiles"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Los admins pueden actualizar perfiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Los admins pueden eliminar perfiles"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );
