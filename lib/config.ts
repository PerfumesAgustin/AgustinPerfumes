export const BUSINESS_WHATSAPP = "5491167463767";
export const BUSINESS_NAME = "Distribuidora AYK Stock";

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("TU-PROYECTO"),
  );
}
