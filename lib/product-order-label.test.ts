import { describe, expect, it } from "vitest";
import { formatProductOrderName, getProductKindLabel } from "./product-order-label";

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
});
