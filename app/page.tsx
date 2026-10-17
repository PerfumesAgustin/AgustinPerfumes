import seed from "@/data/seed-products.json";
import { Catalog } from "@/components/catalog";
import { hasSupabaseConfig } from "@/lib/config";
import type { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { enrichProduct } from "@/lib/catalog-utils";

export const dynamic = "force-dynamic";

async function loadProducts(): Promise<Product[]> {
  if (!hasSupabaseConfig()) return seed as Product[];
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("id,name,gender,stock,min_stock,photo_url,is_active").eq("is_active", true).order("name");
  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  return (data as Product[]).map(enrichProduct);
}

export default async function HomePage() {
  const products = await loadProducts();
  return <Catalog initialProducts={products} configured={hasSupabaseConfig()} />;
}
