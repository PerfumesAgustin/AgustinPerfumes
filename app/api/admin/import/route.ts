import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";

const schema = z.object({ rows: z.array(z.object({ id: z.number().int().positive(), stock: z.number().int().min(0) })).min(1).max(1000) });

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "CSV inválido" }, { status: 400 });
  for (const row of parsed.data.rows) {
    const { error } = await auth.supabase.rpc("set_product_stock", { p_product_id: row.id, p_stock: row.stock, p_reason: "Importación CSV" });
    if (error) return NextResponse.json({ error: `ID ${row.id}: ${error.message}` }, { status: 409 });
  }
  return NextResponse.json({ updated: parsed.data.rows.length });
}
