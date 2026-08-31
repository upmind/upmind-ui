import { describe, it, expect } from "vitest";
import { parseSubproductDetails } from "../product.utils";

/**
 * A domain suggestion product can carry `products_options` / `products_attributes`
 * with a null element. The reduce derefs `rawSubproduct.category.id`, so a null
 * row throws. The parser must tolerate a nullish row rather than throw.
 */
const real = {
  category_id: "c1",
  category: { id: "c1", name: "Cat", multiple: false, required: false },
  pivot: { order: 0 },
  prices: []
} as never;

describe("parseSubproductDetails on a malformed subproduct array", () => {
  it("does not throw on an array containing a null element", () => {
    expect(() => parseSubproductDetails([null] as never, 1)).not.toThrow();
  });

  it("does not throw on a mixed array with a null between real rows", () => {
    expect(() =>
      parseSubproductDetails([real, null, real] as never, 1)
    ).not.toThrow();
  });

  it("returns an array (never throws) for a well-formed row", () => {
    // A hand-built row is deliberately minimal; the guarantee under test is
    // "no throw", not a specific parsed shape (that is covered by the module's
    // fixture-backed integration tests).
    expect(Array.isArray(parseSubproductDetails([real] as never, 1))).toBe(
      true
    );
  });
});
