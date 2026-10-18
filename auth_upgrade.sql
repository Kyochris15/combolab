-- Ejecuta esto UNA vez para activar login + seguridad
-- 1. Agrega dueño a cada combo
alter table combos add column if not exists user_id uuid references auth.users(id);
alter table combos add column if not exists author_email text;

-- 2. Activa RLS (estaba disabled)
alter table combos enable row level security;

-- 3. Limpia políticas viejas
drop policy if exists "public read" on combos;
drop policy if exists "public insert" on combos;
drop policy if exists "public update" on combos;
drop policy if exists "lectura publica" on combos;
drop policy if exists "insert publico" on combos;
drop policy if exists "update likes" on combos;

-- 4. Nuevas políticas con login
create policy "read all" on combos for select using (true);
create policy "insert auth" on combos for insert to authenticated with check (auth.uid() = user_id);
create policy "update auth" on combos for update to authenticated using (true);
create policy "delete owner" on combos for delete to authenticated using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant all on table combos to anon, authenticated;

-- 5. Storage: solo logeados suben, todos ven
drop policy if exists "public upload" on storage.objects;
drop policy if exists "public read" on storage.objects;
create policy "upload auth" on storage.objects for insert to authenticated with check (bucket_id = 'combos');
create policy "read all storage" on storage.objects for select to anon, authenticated using (bucket_id = 'combos');
create policy "delete own storage" on storage.objects for delete to authenticated using (bucket_id = 'combos');
