import { describe, expect, it } from "vitest";
import { formatOrderLabel, formatOrderReference } from "./order-number";

describe("order number formatting", () => {
  it("formats the new sequential numbers", () => {
    expect(formatOrderReference("1")).toBe("N°0001");
    expect(formatOrderReference("0042")).toBe("N°0042");
    expect(formatOrderLabel("0001")).toBe("Pedido N°0001");
  });

  it("keeps historical order references readable", () => {
    expect(formatOrderLabel("PS-20261023-C85C12")).toBe("Pedido PS-20261023-C85C12");
  });
});
