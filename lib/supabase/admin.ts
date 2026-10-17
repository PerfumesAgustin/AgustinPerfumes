import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  const { data: profile } = await supabase.from("admin_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!profile) return { response: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  return { supabase, user };
}
