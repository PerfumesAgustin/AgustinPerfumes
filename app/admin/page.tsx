import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { hasSupabaseConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Order, Product, StockMovement } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasSupabaseConfig()) redirect("/admin/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("admin_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/admin/login?error=not-admin");

  const [productsResult, ordersResult, movementsResult] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("orders").select("*,order_items(product_id,product_name,quantity)").order("created_at", { ascending:false }).limit(100),
    supabase.from("stock_movements").select("*,products(name)").order("created_at", { ascending:false }).limit(200),
  ]);
  if (productsResult.error || ordersResult.error || movementsResult.error) throw new Error("No se pudo cargar el panel administrativo.");
  return <AdminDashboard products={productsResult.data as Product[]} orders={ordersResult.data as Order[]} movements={movementsResult.data as StockMovement[]} email={user.email ?? "Administrador"}/>;
}
