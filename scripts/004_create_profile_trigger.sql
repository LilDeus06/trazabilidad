-- Función para crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, apellido, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', 'Usuario'),
    coalesce(new.raw_user_meta_data ->> 'apellido', 'Nuevo'),
    coalesce(new.raw_user_meta_data ->> 'rol', 'usuario')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger para crear perfil automáticamente
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
