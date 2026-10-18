-- FASE 2: perfiles, comentarios, favoritos, reportes + links
-- Ejecuta en Supabase SQL Editor

-- Perfiles (username + redes)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text,
  twitter text,
  youtube text,
  twitch text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "profiles read" on profiles;
drop policy if exists "profiles upsert" on profiles;
create policy "profiles read" on profiles for select using (true);
create policy "profiles upsert" on profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
grant all on profiles to anon, authenticated;

-- Links externos en combos (ej: tweet / yt de origen)
alter table combos add column if not exists source_url text;
alter table combos add column if not exists fav_count int default 0;
alter table combos add column if not exists comment_count int default 0;

-- Comentarios
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  combo_id uuid references combos(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  username text,
  text text not null,
  created_at timestamptz default now()
);
alter table comments enable row level security;
drop policy if exists "comments read" on comments;
drop policy if exists "comments insert" on comments;
drop policy if exists "comments delete" on comments;
create policy "comments read" on comments for select using (true);
create policy "comments insert" on comments for insert to authenticated with check (true);
create policy "comments delete" on comments for delete to authenticated using (auth.uid() = user_id);
grant all on comments to anon, authenticated;

-- Favoritos
create table if not exists favorites (
  combo_id uuid references combos(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (combo_id, user_id)
);
alter table favorites enable row level security;
drop policy if exists "fav read" on favorites;
drop policy if exists "fav manage" on favorites;
create policy "fav read" on favorites for select using (true);
create policy "fav manage" on favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant all on favorites to anon, authenticated;

-- Reportes
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  combo_id uuid references combos(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  reason text not null,
  created_at timestamptz default now()
);
alter table reports enable row level security;
drop policy if exists "reports insert" on reports;
drop policy if exists "reports read own" on reports;
create policy "reports insert" on reports for insert to authenticated with check (true);
create policy "reports read own" on reports for select to authenticated using (auth.uid() = user_id);
grant all on reports to authenticated;
