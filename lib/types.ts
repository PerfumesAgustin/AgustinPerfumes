export type Gender = "Masculino" | "Femenino" | "Unisex" | "Infantil" | "Sin clasificar";
export type CatalogSection = "extractos" | "tubitos_arabes";

export type Product = {
  id: number;
  name: string;
  gender: Gender;
  stock: number;
  min_stock: number;
  photo_url: string | null;
  catalog_section: CatalogSection;
  inspired_by?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  product_id: number;
  product_name: string;
  quantity: number;
};

export type Order = {
  id: string;
  order_number: string;
  reseller_name: string;
  phone: string;
  notes: string | null;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  total_units: number;
  created_at: string;
  order_items?: OrderItem[];
};

export type StockMovement = {
  id: number;
  product_id: number;
  movement_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reason: string | null;
  created_at: string;
  products?: { name: string } | null;
};
