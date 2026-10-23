export const ORDER_RECIPIENTS = [
  { id: "agustin", name: "Agustín", phone: "5491167463767", displayPhone: "11 6746-3767" },
  { id: "kathi", name: "Kathi", phone: "5491123730486", displayPhone: "11 2373-0486" },
] as const;
export const BUSINESS_NAME = "AYK";

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("TU-PROYECTO"),
  );
}
