-- LIMPIAR BASE DE DATOS PARA EMPEZAR DE 0
-- Mantiene tu cuenta de usuario y perfil, borra todo el contenido de prueba
-- Ejecutar en Supabase > SQL Editor

-- 1. Borrar en orden por dependencias (foreign keys)
delete from comments;
delete from favorites;
delete from follows;
delete from user_badges;
delete from reports;
delete from combos;

-- 2. Resetear XP y nivel de todos los perfiles (opcional, quitar si quieres mantener niveles)
-- UPDATE profiles SET xp = 0, level = 1;

-- 3. Verificar que quede vacío
select 'combos' as tabla, count(*) as registros from combos
union all select 'comments', count(*) from comments
union all select 'favorites', count(*) from favorites
union all select 'follows', count(*) from follows
union all select 'reports', count(*) from reports
union all select 'user_badges', count(*) from user_badges;
