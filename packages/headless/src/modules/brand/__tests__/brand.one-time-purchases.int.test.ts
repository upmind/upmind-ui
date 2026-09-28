// -----------------------------------------------------------------------------
/**
 * @fileoverview brand — the one-time-purchases condition, hidden (AC-17,
 * FE-3237 D-17)
 *
 * ## Job To Be Done
 * Prove `useBrand().hideOneTimePurchases` follows the legacy rule
 * `meta.portal["@context.oneTimePurchases"] === "hidden"`: the value
 * `hidden` hides one-time purchases.
 *
 * ## Provenance
 * The recorded `get-brand-settings` capture with only `meta.portal` changed
 * (design 8.8 "one-time purchases" construction).
 *
 * ## What Breaks If These Fail
 * The order items link a one-time purchase that the brand hides.
 */

import { describe, expect, it } from "vitest";
import { bootBrandWithOneTimePurchases } from "./brand.one-time-purchases.int-helpers";

// -----------------------------------------------------------------------------

describe("brand — the one-time-purchases condition (AC-17)", () => {
  it("the value hidden: hideOneTimePurchases is true", async () => {
    const brand = await bootBrandWithOneTimePurchases("hidden");
    expect(brand.hideOneTimePurchases.value).toBe(true);
  });
});
