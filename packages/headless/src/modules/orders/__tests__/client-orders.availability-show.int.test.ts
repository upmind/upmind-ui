// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — store visibility, display mode `show`
 * (AC-5, D-16)
 *
 * ## Job To Be Done
 * Prove `showStore` is true for a signed-in client when the brand config
 * `ui.client_area.show_catalog` is `show`.
 *
 * ## Provenance
 * Declared construction (design 8.8, "each store display mode"): the recorded
 * brand config with only `ui.client_area.show_catalog` set. One brand state per file.
 *
 * ## What Breaks If These Fail
 * A brand that always shows its store hides the store control.
 */

import { describe, expect, it } from "vitest";
import { bootCollectionOnBrand } from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

describe("client-orders — the store display mode show (AC-5)", () => {
  it("showStore is true", async () => {
    const meta = await bootCollectionOnBrand({
      config: data => ({ ...data, "ui.client_area.show_catalog": "show" })
    });
    expect(meta.showStore.value).toBe(true);
  });
});
