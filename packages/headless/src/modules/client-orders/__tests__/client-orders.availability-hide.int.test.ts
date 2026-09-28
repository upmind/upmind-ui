// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — store visibility, display mode `hide`
 * (AC-5, D-16)
 *
 * ## Job To Be Done
 * Prove `showStore` is false for a signed-in client when the brand config
 * `ui.client_area.show_catalog` is `hide`.
 *
 * ## Provenance
 * Declared construction (design 8.8, "each store display mode"): the recorded
 * brand config with only `ui.client_area.show_catalog` set. One brand state per file.
 *
 * ## What Breaks If These Fail
 * A brand that turned its client store off keeps a live store control on the order history.
 */

import { describe, expect, it } from "vitest";
import { bootCollectionOnBrand } from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

describe("client-orders — the store display mode hide (AC-5)", () => {
  it("showStore is false", async () => {
    const meta = await bootCollectionOnBrand({
      config: data => ({ ...data, "ui.client_area.show_catalog": "hide" })
    });
    expect(meta.showStore.value).toBe(false);
  });
});
