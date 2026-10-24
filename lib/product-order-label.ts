import type { CatalogSection } from "@/lib/types";

export function getProductKindLabel(section: CatalogSection) {
  return section === "tubitos_arabes" ? "Tubito Árabe 35 ML" : "Extracto de 60 ML";
}

export function getProductGroupLabel(section: CatalogSection) {
  return section === "tubitos_arabes" ? "Tubitos Árabes 35 ML" : "Extractos de 60 ML";
}

export function formatProductOrderName(product: { name: string; catalog_section: CatalogSection }) {
  return `${getProductKindLabel(product.catalog_section)} · ${product.name}`;
}

export function cleanProductOrderName(name: string) {
  return name.replace(/^(?:Extracto de 60 ML|Tubito Árabe 35 ML)\s*·\s*/i, "");
}

export function inferProductSection(name: string): CatalogSection {
  return /^Tubito Árabe 35 ML\s*·/i.test(name) ? "tubitos_arabes" : "extractos";
}

export function groupOrderItems<T extends { quantity: number; catalog_section: CatalogSection }>(items: T[]) {
  return (["extractos", "tubitos_arabes"] as const).map((section) => {
    const sectionItems = items.filter((item) => item.catalog_section === section);
    return {
      section,
      label: getProductGroupLabel(section),
      total: sectionItems.reduce((sum, item) => sum + item.quantity, 0),
      items: sectionItems,
    };
  }).filter((group) => group.total > 0);
}
