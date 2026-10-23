import type { CatalogSection } from "@/lib/types";

export function getProductKindLabel(section: CatalogSection) {
  return section === "tubitos_arabes" ? "Tubito Árabe 35 ML" : "Extracto de 60 ML";
}

export function formatProductOrderName(product: { name: string; catalog_section: CatalogSection }) {
  return `${getProductKindLabel(product.catalog_section)} · ${product.name}`;
}
