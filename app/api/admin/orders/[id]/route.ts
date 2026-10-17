import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";

const schema = z.object({ action: z.enum(["confirm", "reject", "cancel"]) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  const result = parsed.data.action === "confirm"
    ? await auth.supabase.rpc("confirm_order", { p_order_id: id })
    : await auth.supabase.rpc("set_order_status", { p_order_id: id, p_status: parsed.data.action === "reject" ? "rejected" : "cancelled" });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 409 });
  return NextResponse.json({ ok: true });
}
