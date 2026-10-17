import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/config";

const schema = z.object({
  reseller_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  notes: z.string().trim().max(1000).optional().default(""),
  items: z.array(z.object({ product_id: z.number().int().positive(), quantity: z.number().int().positive() })).min(1).max(100),
});

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase todavía no está configurado. El pedido no fue guardado." }, { status: 503 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos del pedido." }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("create_order", {
    p_reseller_name: parsed.data.reseller_name,
    p_phone: parsed.data.phone,
    p_notes: parsed.data.notes,
    p_items: parsed.data.items,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json(data, { status: 201 });
}
