import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";
import { syncProductPublications } from "@/lib/product-publication";

const schema = z.object({ action: z.enum(["confirm", "reject", "cancel", "reopen"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  const shouldSyncStock = parsed.data.action === "confirm" || parsed.data.action === "cancel";
  const { data: items, error: itemsError } = shouldSyncStock
    ? await auth.supabase.from("order_items").select("product_id").eq("order_id", id)
    : { data: [], error: null };
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 409 });
  const productIds = (items ?? []).map((item) => item.product_id);
  const { data: previousProducts, error: previousError } = shouldSyncStock
    ? await auth.supabase.from("products").select("id,stock").in("id", productIds)
    : { data: [], error: null };
  if (previousError) return NextResponse.json({ error: previousError.message }, { status: 409 });
  const previousStock = new Map((previousProducts ?? []).map((product) => [product.id, product.stock]));
  const result = parsed.data.action === "confirm"
    ? await auth.supabase.rpc("confirm_order", { p_order_id: id })
    : parsed.data.action === "reopen"
      ? await auth.supabase.rpc("reopen_order", { p_order_id: id })
      : await auth.supabase.rpc("set_order_status", { p_order_id: id, p_status: parsed.data.action === "reject" ? "rejected" : "cancelled" });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 409 });
  if (shouldSyncStock) {
    const publicationError = await syncProductPublications(auth.supabase, productIds, previousStock);
    if (publicationError) return NextResponse.json({ error: publicationError.message }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
