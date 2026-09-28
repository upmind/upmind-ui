// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — store visibility, display mode `show_logged_in`
 * (AC-5, D-16)
 *
 * ## Job To Be Done
 * Prove `showStore` is true for a signed-in client when the brand config
 * `ui.client_area.show_catalog` is `show_logged_in`.
 *
 * ## Provenance
 * Declared construction (design 8.8, "each store display mode"): the recorded
 * brand config with only `ui.client_area.show_catalog` set. One brand state per file.
 *
 * ## What Breaks If These Fail
 * A signed-in client of a brand that shows its store to signed-in clients loses the store control.
 */

import { describe, expect, it } from "vitest";
import { bootCollectionOnBrand } from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

describe("client-orders — the store display mode show_logged_in (AC-5)", () => {
  it("showStore is true", async () => {
    const meta = await bootCollectionOnBrand({
      config: data => ({
        ...data,
        "ui.client_area.show_catalog": "show_logged_in"
      })
    });
    expect(meta.showStore.value).toBe(true);
  });
});
