# ComboLab - Mejores combos de juegos de pelea

Plataforma para subir, descubrir y votar los mejores combos de juegos de pelea modernos (Street Fighter 6, Tekken 8, Mortal Kombat 1, Guilty Gear Strive, KOF XV, Dragon Ball FighterZ).

## Características

- 🥊 Subir combos con video (mp4/webm, máximo 50MB)
- 📝 Notación, daño, dificultad y categoría del combo
- 🔗 Link a fuente (X/Twitter, YouTube)
- 👤 Perfiles de usuario con avatar, banner y bio
- 🔗 Redes sociales (X, YouTube, Twitch)
- 💬 Comentarios en cada combo
- ❤️ Likes y sistema de niveles/XP
- 🏆 Badges por logros
- ⭐ Favoritos y seguidores
- 🔍 Buscar por juego, personaje, título o categoría
- 🔥 Top semanal de combos más votados
- 👮 Panel de moderación (reportes, banear usuarios, borrar combos)

## Tecnologías

- HTML5, CSS3, JavaScript vanilla
- [Supabase](https://supabase.com) (Base de datos, Storage, Auth)
- Diseño oscuro tipo arcade/FGC

## Cómo ponerlo en marcha

### 1. Clonar o descargar
Descarga este repositorio o clónalo:
```bash
git clone https://github.com/TU_USUARIO/combolab.git
cd combolab
```

### 2. Crear proyecto en Supabase
1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. En **SQL Editor**, ejecuta estos archivos en orden:
   - `supabase.sql` — tabla de combos y políticas básicas
   - `phase2.sql` — perfiles, comentarios, favoritos, reportes
   - `profile_images.sql` — avatar y banner
   - `follows.sql` — sistema de seguir usuarios
   - `improvements_345.sql` — categorías, niveles, badges

### 3. Configurar Storage
1. En Supabase > Storage, crea un bucket público llamado `combos`
2. Configura límite de archivo a 50MB y tipos MIME: `video/mp4, video/webm`
3. Agrega políticas de subida para usuarios autenticados

### 4. Conectar tu proyecto
1. En Supabase > Project Settings > Data API, copia:
   - **Project URL**
   - **anon public key**
2. Abre `app.js` y pega tus claves en las constantes al principio:
   ```js
   const SUPABASE_URL = "https://tu-proyecto.supabase.co";
   const SUPABASE_KEY = "tu-anon-key";
   ```
3. (Opcional) Edita `ADMIN_EMAILS` en `app.js` con tu correo para acceder al panel de moderación.

### 5. Ejecutar localmente
```bash
# Con Python
python -m http.server 8000

# O con Node (serve)
npx serve .
```
Luego abre `http://localhost:8000`

### 6. Limpiar base de datos (opcional)
Si quieres empezar desde cero sin contenido de prueba, ejecuta `limpiar_base.sql` en Supabase SQL Editor.

## Estructura del proyecto

```
combolab/
├── index.html      # Página principal
├── style.css       # Estilos
├── app.js          # Lógica y conexión a Supabase
├── supabase.sql    # Esquema inicial (tabla combos)
├── phase2.sql      # Perfiles, comentarios, favoritos, reportes
├── profile_images.sql  # Avatar y banner
├── follows.sql     # Seguir usuarios
├── improvements_345.sql # Categorías, niveles, badges
├── limpiar_base.sql    # Borrar contenido de prueba
├── .gitignore      # Archivos ignorados por Git
└── README.md       # Este archivo
```

## Licencia

MIT

## Advertencia de seguridad

No subas tus claves de Supabase a repositorios públicos si planeas usar este proyecto en producción. Para uso personal y aprendizaje está bien, pero considera usar variables de entorno en un entorno real.
