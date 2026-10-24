import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  gender: z.enum(["Masculino", "Femenino", "Unisex", "Infantil", "Sin clasificar"]).optional(),
  min_stock: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
  delta: z.number().int().refine((value) => value !== 0).optional(),
  catalog_section: z.enum(["extractos", "tubitos_arabes"]).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const productId = Number(id);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!Number.isInteger(productId) || !parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (parsed.data.delta !== undefined) {
    const { data, error } = await auth.supabase.rpc("adjust_stock", { p_product_id: productId, p_delta: parsed.data.delta, p_reason: "Ajuste desde el panel" });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ stock: data });
  }
  if (parsed.data.stock !== undefined) {
    const { data, error } = await auth.supabase.rpc("set_product_stock", { p_product_id: productId, p_stock: parsed.data.stock, p_reason: "Cantidad exacta desde el panel" });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    const rest = { ...parsed.data };
    delete rest.stock;
    if (Object.keys(rest).length) await auth.supabase.from("products").update(rest).eq("id", productId);
    return NextResponse.json({ stock: data });
  }
  const { delta: _delta, ...updates } = parsed.data;
  const { data, error } = await auth.supabase.from("products").update(updates).eq("id", productId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const { error } = await auth.supabase.from("products").update({ is_active: false }).eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
