  -- Tabla de follows (seguir jugadores)
  create table if not exists follows (
    follower_id uuid references auth.users(id) on delete cascade not null,
    following_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    primary key (follower_id, following_id)
  );
  alter table follows enable row level security;
  drop policy if exists "follows read" on follows;
  drop policy if exists "follows manage" on follows;
  create policy "follows read" on follows for select using (true);
  create policy "follows manage" on follows for all to authenticated using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
  grant all on follows to anon, authenticated;

  -- Índice para búsquedas de username
  create index if not exists idx_profiles_username on profiles(username);
