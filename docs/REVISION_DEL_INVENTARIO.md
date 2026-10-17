# Revisión del inventario importado

## Resultado

| Control | Resultado |
|---|---:|
| Registros originales | 204 |
| Unidades originales | 900 |
| Registros con foto validada | 151 |
| Registros con foto pendiente | 53 |

No se fusionaron productos solamente por tener nombres parecidos y no se repartieron cantidades entre variantes. Cuando una fotografía no tenía una correspondencia explícita y segura con el inventario, el producto quedó visible con una tarjeta neutra para revisión desde el panel.

Las asociaciones revisadas viven en `scripts/prepare-data.mjs`. El inventario original se conserva en `data/inventory-source.json` y el resultado reproducible en `data/seed-products.json` y `supabase/seed.sql`.

