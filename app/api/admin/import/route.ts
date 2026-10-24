import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";
import { syncProductPublications } from "@/lib/product-publication";

const schema = z.object({ rows: z.array(z.object({ id: z.number().int().positive(), stock: z.number().int().min(0) })).min(1).max(1000) });

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "CSV inválido" }, { status: 400 });
  const ids = parsed.data.rows.map((row) => row.id);
  const { data: previousProducts, error: previousError } = await auth.supabase.from("products").select("id,stock").in("id", ids);
  if (previousError) return NextResponse.json({ error: previousError.message }, { status: 409 });
  const previousStock = new Map((previousProducts ?? []).map((product) => [product.id, product.stock]));
  for (const row of parsed.data.rows) {
    const { error } = await auth.supabase.rpc("set_product_stock", { p_product_id: row.id, p_stock: row.stock, p_reason: "Importación CSV" });
    if (error) return NextResponse.json({ error: `ID ${row.id}: ${error.message}` }, { status: 409 });
  }
  const publicationError = await syncProductPublications(auth.supabase, ids, previousStock);
  if (publicationError) return NextResponse.json({ error: publicationError.message }, { status: 409 });
  return NextResponse.json({ updated: parsed.data.rows.length });
}
