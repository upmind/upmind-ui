// -----------------------------------------------------------------------------
/**
 * @fileoverview brand — the one-time-purchases condition, shown (AC-17,
 * FE-3237 D-17)
 *
 * ## Job To Be Done
 * Prove `useBrand().hideOneTimePurchases` is false when
 * `meta.portal["@context.oneTimePurchases"]` is `shown`.
 *
 * ## Provenance
 * The recorded `get-brand-settings` capture with only `meta.portal` changed
 * (design 8.8 "one-time purchases" construction).
 *
 * ## What Breaks If These Fail
 * The order items hide a one-time purchase link that the brand shows.
 */

import { describe, expect, it } from "vitest";
import { bootBrandWithOneTimePurchases } from "./brand.one-time-purchases.int-helpers";

// -----------------------------------------------------------------------------

describe("brand — the one-time-purchases condition (AC-17)", () => {
  it("the value shown: hideOneTimePurchases is false", async () => {
    const brand = await bootBrandWithOneTimePurchases("shown");
    expect(brand.hideOneTimePurchases.value).toBe(false);
  });
});
