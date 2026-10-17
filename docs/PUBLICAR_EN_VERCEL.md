# Publicar en GitHub y Vercel

Hacé estos pasos después de comprobar la aplicación local con Supabase.

## GitHub

Desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Aplicación de stock mayorista de perfumes"
git branch -M main
git remote add origin URL-DE-TU-REPOSITORIO
git push -u origin main
```

`.env.local` está excluido por Git y no debe subirse.

## Vercel

1. En Vercel, elegí **Add New > Project** e importá el repositorio.
2. Conservá la configuración automática de Next.js.
3. En **Environment Variables**, agregá:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Publicá el proyecto.
5. Probá el catálogo, un pedido y el ingreso a `/admin/login` desde la URL final.

No se necesita un servidor separado ni una clave `service_role` en Vercel. Las reglas de Supabase y las validaciones del servidor protegen las operaciones sensibles.

