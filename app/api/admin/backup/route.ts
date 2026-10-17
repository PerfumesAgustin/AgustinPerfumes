import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const [products, orders, movements, settings] = await Promise.all([
    auth.supabase.from("products").select("*").order("id"),
    auth.supabase.from("orders").select("*,order_items(*)").order("created_at"),
    auth.supabase.from("stock_movements").select("*").order("created_at"),
    auth.supabase.from("business_settings").select("*").maybeSingle(),
  ]);

  const failure = [products.error, orders.error, movements.error, settings.error].find(Boolean);
  if (failure) return NextResponse.json({ error: failure.message }, { status: 500 });

  const createdAt = new Date().toISOString();
  const date = createdAt.slice(0, 10);
  const body = JSON.stringify({
    format: "distribuidora-ayk-stock-backup-v1",
    created_at: createdAt,
    products: products.data,
    orders: orders.data,
    stock_movements: movements.data,
    business_settings: settings.data,
  }, null, 2);

  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="distribuidora-ayk-stock-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}
