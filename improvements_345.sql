-- MEJORAS 3, 4, 5: Categorías, XP/Niveles, Moderación
-- Ejecutar en Supabase SQL Editor

-- 3. Categoría en combos
alter table combos add column if not exists categoria text check (categoria in ('Wall carry','Kill','Anti-air','Otoshi','Corrección','Frame trap','Otro'));

-- 4. XP, Level, Banned en perfiles
alter table profiles add column if not exists xp int default 0;
alter table profiles add column if not exists level int default 1;
alter table profiles add column if not exists banned boolean default false;

-- Badges
create table if not exists badges (
  id text primary key,
  name text not null,
  icon text not null,
  description text
);
insert into badges (id, name, icon, description) values
  ('first_combo', 'Primer combo', '🥊', 'Sube tu primer combo'),
  ('five_combos', 'Cinco combos', '💥', 'Sube 5 combos'),
  ('hundred_likes', '100 likes', '❤️', 'Recibe 100 likes en total'),
  ('commenter', 'Comentarista', '💬', 'Haz 5 comentarios')
on conflict (id) do nothing;

-- Badges ganados por usuario
create table if not exists user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  badge_id text references badges(id),
  earned_at timestamptz default now(),
  unique (user_id, badge_id)
);
alter table user_badges enable row level security;
drop policy if exists "user_badges read" on user_badges;
drop policy if exists "user_badges insert" on user_badges;
create policy "user_badges read" on user_badges for select using (true);
create policy "user_badges insert" on user_badges for insert to authenticated with check (auth.uid() = user_id);
grant all on user_badges to anon, authenticated;

-- Índices
create index if not exists idx_combos_categoria on combos(categoria);
create index if not exists idx_profiles_xp on profiles(xp desc);
