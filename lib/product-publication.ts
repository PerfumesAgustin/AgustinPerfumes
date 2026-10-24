import type { SupabaseClient } from "@supabase/supabase-js";
import { isDeletedProduct } from "@/lib/product-deletion";

export async function syncProductPublications(supabase: SupabaseClient, productIds: number[], previousStock = new Map<number, number>()) {
  const ids = [...new Set(productIds)].filter(Number.isInteger);
  if (!ids.length) return null;

  const { data, error } = await supabase.from("products").select("id,stock,is_active,source_name").in("id", ids);
  if (error) return error;

  for (const product of data ?? []) {
    if (isDeletedProduct(product.source_name)) continue;
    const shouldBeActive = product.stock === 0
      ? false
      : previousStock.get(product.id) === 0
        ? true
        : product.is_active;
    if (shouldBeActive === product.is_active) continue;
    const { error: updateError } = await supabase.from("products").update({ is_active: shouldBeActive }).eq("id", product.id);
    if (updateError) return updateError;
  }
  return null;
}
