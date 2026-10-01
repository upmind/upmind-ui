// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — store visibility, display mode key removed
 * (AC-5, D-16)
 *
 * ## Job To Be Done
 * Prove `showStore` stays true when the brand config holds no
 * `ui.client_area.show_catalog` key, the legacy default.
 *
 * ## Provenance
 * Declared construction (design 8.8, "each store display mode"): the recorded
 * brand config with the `ui.client_area.show_catalog` key removed. One brand state per file.
 *
 * ## What Breaks If These Fail
 * A brand that never set a display mode loses its store control.
 */

import { describe, expect, it } from "vitest";
import { bootCollectionOnBrand } from "./client-orders.int-helpers";
import { omit } from "lodash-es";

// -----------------------------------------------------------------------------

describe("client-orders — the store display mode key removed (AC-5)", () => {
  it("showStore is true", async () => {
    const meta = await bootCollectionOnBrand({
      config: data => omit(data, "ui.client_area.show_catalog")
    });
    expect(meta.showStore.value).toBe(true);
  });
});
