# Configurar Supabase

Supabase es necesario para la versión publicada porque guarda stock, pedidos, usuarios administradores, historial y fotografías nuevas. La cuenta gratuita alcanza para comenzar.

## 1. Crear el proyecto

1. Creá una cuenta en Supabase y un proyecto nuevo.
2. Guardá la contraseña de la base de datos en un lugar seguro.
3. En **Project Settings > API**, copiá la URL del proyecto y la clave pública `anon`/`publishable`.
4. En este proyecto, copiá `.env.example` como `.env.local` y reemplazá los valores de ejemplo.

No agregues la clave `service_role`: esta aplicación no la necesita.

## 2. Crear tablas, permisos y almacenamiento

En **SQL Editor**, ejecutá completo y en este orden:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

El primer archivo crea las tablas, las políticas RLS, las funciones atómicas de stock y el bucket público `perfume-images`. El segundo carga los 204 registros y las 900 unidades originales.

## 3. Crear el administrador

1. En **Authentication > Users**, elegí **Add user** y creá el usuario con correo y contraseña.
2. Copiá el UUID del usuario.
3. En **SQL Editor**, ejecutá reemplazando el UUID:

```sql
insert into public.admin_profiles (user_id, display_name)
values ('UUID-DEL-USUARIO', 'Agustín');
```

La existencia en `admin_profiles` es lo que habilita el panel. Un usuario de Auth sin ese registro no obtiene acceso administrativo.

## 4. Probar

```bash
npm run dev
```

- Catálogo: `http://localhost:3000`
- Administración: `http://localhost:3000/admin/login`

Creá primero un pedido pequeño y comprobá que aparezca como pendiente. Al confirmarlo desde el panel se descuenta el stock. Al cancelarlo se repone y queda el movimiento registrado.

## Fotografías

Las fotos iniciales revisadas están incluidas en `public/product-images`. Las imágenes que se cambien desde el panel se guardan en Supabase Storage. Al reemplazar o quitar una imagen subida, el archivo anterior también se elimina del bucket; las fotos iniciales locales nunca se borran accidentalmente.

