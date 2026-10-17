import { describe, expect, it } from "vitest";
import { activeInventorySummary, canonicalProductName, enrichProduct, verifiedInspiration } from "./catalog-utils";
import type { Product } from "./types";

function product(overrides: Partial<Product>): Product {
  return {
    id: 1,
    name: "Producto",
    gender: "Sin clasificar",
    stock: 5,
    min_stock: 3,
    photo_url: null,
    is_active: true,
    ...overrides,
  };
}

describe("canonicalProductName", () => {
  it("corrige errores confirmados sin unir productos diferentes", () => {
    expect(canonicalProductName("ligth blue masculino")).toBe("Light Blue Masculino");
    expect(canonicalProductName("most wanted")).toBe("Most Wanted");
    expect(canonicalProductName("the most wanted")).toBe("The Most Wanted");
  });
});

describe("verifiedInspiration", () => {
  it("usa únicamente el nombre de un archivo local revisado", () => {
    expect(verifiedInspiration("/product-images/1%20Million%20-%20Rabanne.jpeg")).toBe("1 Million — Rabanne");
  });

  it("no deduce información de fotos subidas con nombres aleatorios", () => {
    expect(verifiedInspiration("https://example.com/storage/random-id.jpg")).toBeNull();
  });

  it("omite asociaciones conocidas que corresponden a otra variante", () => {
    expect(verifiedInspiration("/product-images/Khamrah%20Qahwa%20-%20Lattafa.jpeg", "Khamrah Hawa")).toBeNull();
    expect(verifiedInspiration("/product-images/The%20Most%20Wanted%20-%20Azzaro.jpeg", "Most Wanted")).toBeNull();
  });
});

describe("activeInventorySummary", () => {
  it("excluye productos archivados de productos, unidades y alertas", () => {
    const summary = activeInventorySummary([
      product({ id: 1, stock: 10 }),
      product({ id: 2, stock: 2 }),
      product({ id: 3, stock: 8, is_active: false }),
    ]);
    expect(summary).toEqual({ products: 2, units: 12, lowStock: 1 });
  });
});

describe("enrichProduct", () => {
  it("normaliza el nombre y agrega inspiración verificada", () => {
    expect(enrichProduct(product({ name: "Baccarat rouget", photo_url: "/product-images/Baccarat%20Rouge%20540%20-%20Maison%20Francis%20Kurkdjian.jpeg" }))).toMatchObject({
      name: "Baccarat Rouge 540",
      inspired_by: "Baccarat Rouge 540 — Maison Francis Kurkdjian",
    });
  });
});
