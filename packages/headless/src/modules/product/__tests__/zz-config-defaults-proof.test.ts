import { describe, it, expect } from "vitest";
import { applyConfigDefaults } from "../product.services";

// The exact shapes domain feeds it from a suggestion result.
const baseModel = { productId: "x", quantity: 1, term: 1 } as never;

describe("applyConfigDefaults never throws on a malformed suggestion product", () => {
  it("raw undefined -> baseModel, no throw", () => {
    expect(() => applyConfigDefaults(baseModel, undefined)).not.toThrow();
  });
  it("raw {} (no id) -> baseModel, no throw", () => {
    expect(() => applyConfigDefaults(baseModel, {} as never)).not.toThrow();
  });
  it("raw with id but nothing else -> no throw", () => {
    expect(() =>
      applyConfigDefaults(baseModel, { id: "p1" } as never)
    ).not.toThrow();
  });
});
