-- Crear tabla de guías (registro de salidas de camiones)
create table if not exists public.guias (
  id uuid primary key default gen_random_uuid(),
  fecha_hora timestamp with time zone default timezone('utc'::text, now()) not null,
  id_camion uuid not null references public.camiones(id) on delete cascade,
  enviadas integer not null default 0,
  guias text not null,
  usuario_id uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.guias enable row level security;

-- Políticas para guías
create policy "Usuarios autenticados pueden ver guías"
  on public.guias for select
  using (auth.uid() is not null);

create policy "Usuarios autenticados pueden insertar guías"
  on public.guias for insert
  with check (auth.uid() = usuario_id);

create policy "Solo admins pueden actualizar guías"
  on public.guias for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

create policy "Solo admins pueden eliminar guías"
  on public.guias for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );
