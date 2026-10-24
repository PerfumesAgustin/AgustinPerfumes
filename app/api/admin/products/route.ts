import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  gender: z.enum(["Masculino", "Femenino", "Unisex", "Infantil", "Sin clasificar"]),
  stock: z.number().int().min(0).default(0),
  min_stock: z.number().int().min(0).default(3),
  catalog_section: z.enum(["extractos", "tubitos_arabes"]).default("extractos"),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { data, error } = await auth.supabase.from("products").insert({ ...parsed.data, is_active: true, data_status: "revisar" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
