import { describe, expect, it } from "vitest";
import { cleanProductOrderName, formatProductOrderName, getProductKindLabel, groupOrderItems, inferProductSection } from "./product-order-label";

describe("product order labels", () => {
  it("identifies 60 ML extracts", () => {
    expect(getProductKindLabel("extractos")).toBe("Extracto de 60 ML");
    expect(formatProductOrderName({ name: "Good Girl", catalog_section: "extractos" }))
      .toBe("Extracto de 60 ML · Good Girl");
  });

  it("identifies 35 ML Arabic tubes", () => {
    expect(getProductKindLabel("tubitos_arabes")).toBe("Tubito Árabe 35 ML");
    expect(formatProductOrderName({ name: "Yara Elixir", catalog_section: "tubitos_arabes" }))
      .toBe("Tubito Árabe 35 ML · Yara Elixir");
  });

  it("groups products and calculates each presentation total", () => {
    const groups = groupOrderItems([
      { name: "Erba Pura", quantity: 1, catalog_section: "extractos" as const },
      { name: "Fren", quantity: 13, catalog_section: "extractos" as const },
      { name: "Mario Bros", quantity: 6, catalog_section: "tubitos_arabes" as const },
    ]);
    expect(groups.map(({ label, total }) => ({ label, total }))).toEqual([
      { label: "Extractos de 60 ML", total: 14 },
      { label: "Tubitos Árabes 35 ML", total: 6 },
    ]);
  });

  it("reads stored order item labels", () => {
    expect(inferProductSection("Tubito Árabe 35 ML · Mario Bros")).toBe("tubitos_arabes");
    expect(cleanProductOrderName("Extracto de 60 ML · Erba Pura")).toBe("Erba Pura");
  });
});
