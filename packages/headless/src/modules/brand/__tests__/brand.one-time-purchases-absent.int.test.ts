// -----------------------------------------------------------------------------
/**
 * @fileoverview brand — the one-time-purchases condition, key absent (AC-17,
 * FE-3237 D-17)
 *
 * ## Job To Be Done
 * Prove `useBrand().hideOneTimePurchases` is false when the brand settings
 * carry no `meta.portal` key.
 *
 * ## Provenance
 * The recorded `get-brand-settings` capture with `meta.portal` removed
 * (design 8.8 "one-time purchases" construction).
 *
 * ## What Breaks If These Fail
 * A brand that never set the key loses every one-time purchase link.
 */

import { describe, expect, it } from "vitest";
import { bootBrandWithOneTimePurchases } from "./brand.one-time-purchases.int-helpers";

// -----------------------------------------------------------------------------

describe("brand — the one-time-purchases condition (AC-17)", () => {
  it("no portal key: hideOneTimePurchases is false", async () => {
    const brand = await bootBrandWithOneTimePurchases(undefined);
    expect(brand.hideOneTimePurchases.value).toBe(false);
  });
});
