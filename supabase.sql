-- Ejecuta esto en Supabase > SQL Editor
create table combos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  juego text not null,
  personaje text not null,
  titulo text not null,
  dano int,
  dificultad text check (dificultad in ('Fácil','Medio','Difícil','Experto')),
  notacion text,
  descripcion text,
  video_url text not null,
  likes int default 0
);

-- Permitir lectura pública y subida pública (para MVP, luego agrega Auth)
alter table combos enable row level security;
create policy "lectura publica" on combos for select using (true);
create policy "insert publico" on combos for insert with check (true);
create policy "update likes" on combos for update using (true);

-- Storage: crea un bucket llamado "combos" tipo Public en Storage > New bucket
-- Y agrega esta policy en Storage > Policies:
-- Permite subir mp4/webm de hasta 50MB (configúralo en el bucket)
