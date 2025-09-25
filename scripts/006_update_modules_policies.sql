-- Políticas completas para los módulos Campo, Acopio y Packing

-- Políticas para campo_recoleccion
create policy "Admins y operadores pueden insertar campo_recoleccion"
  on public.campo_recoleccion for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins y operadores pueden actualizar campo_recoleccion"
  on public.campo_recoleccion for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins pueden eliminar campo_recoleccion"
  on public.campo_recoleccion for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );

-- Políticas para campo_carreta
create policy "Admins y operadores pueden insertar campo_carreta"
  on public.campo_carreta for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins y operadores pueden actualizar campo_carreta"
  on public.campo_carreta for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

-- Políticas para acopio_recepcion
create policy "Admins y operadores pueden insertar acopio_recepcion"
  on public.acopio_recepcion for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins y operadores pueden actualizar acopio_recepcion"
  on public.acopio_recepcion for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

-- Políticas para acopio_pallets
create policy "Admins y operadores pueden insertar acopio_pallets"
  on public.acopio_pallets for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins y operadores pueden actualizar acopio_pallets"
  on public.acopio_pallets for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

-- Políticas para acopio_carga
create policy "Admins y operadores pueden insertar acopio_carga"
  on public.acopio_carga for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins y operadores pueden actualizar acopio_carga"
  on public.acopio_carga for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

-- Políticas para packing
create policy "Admins y operadores pueden insertar packing"
  on public.packing for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins y operadores pueden actualizar packing"
  on public.packing for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol in ('admin', 'operador')
    )
  );

create policy "Admins pueden eliminar packing"
  on public.packing for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'admin'
    )
  );
