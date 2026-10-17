# Distribuidora AYK Stock

Catálogo mayorista y panel de inventario construido con Next.js 16 y Supabase.

## Estado de la entrega

- 145 productos activos y 884 unidades disponibles en el catálogo público.
- Todas las fragancias activas tienen una fotografía cargada.
- Los dos productos archivados quedan separados de los totales activos del panel.
- Los nombres visibles se normalizan sin fusionar variantes diferentes.
- La inspiración se muestra solamente cuando la asociación de la fotografía está verificada.
- Carrito temporal en el navegador y pedidos definitivos guardados en Supabase.
- Confirmación de pedidos con descuento atómico de stock y cancelación con reposición.
- Panel protegido para productos, fotos, existencias, pedidos, movimientos y CSV.
- Mensaje de WhatsApp al comercio: `+54 9 11 6746-3767`.

## Probar sin Supabase

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`. Sin variables de entorno se muestra el catálogo completo en modo demostración. En ese modo no se pueden confirmar pedidos ni ingresar al panel, porque esas operaciones necesitan una base real.

## Activar la aplicación completa

1. Seguí [docs/CONFIGURAR_SUPABASE.md](docs/CONFIGURAR_SUPABASE.md).
2. Copiá `.env.example` como `.env.local` y completá las dos variables públicas.
3. Reiniciá `npm run dev`.
4. Ingresá en `http://localhost:3000/admin/login`.

## Verificación

```bash
npm run check
```

El script de datos usa solamente vinculaciones explícitas de imágenes. No realiza coincidencias aproximadas.

Desde el panel administrativo se puede descargar un respaldo JSON completo de productos, pedidos, movimientos y configuración.

## Publicación

Cuando Supabase ya esté configurado, continuá con [docs/PUBLICAR_EN_VERCEL.md](docs/PUBLICAR_EN_VERCEL.md).

