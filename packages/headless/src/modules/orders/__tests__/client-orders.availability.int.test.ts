// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the collection reports its availability and
 * the store control, the recorded brand unchanged (AC-5, D-16)
 *
 * ## Job To Be Done
 * Prove the collection publishes `isAvailable` for a signed-in client, and
 * `showStore` and `storefrontUrl` by the legacy brand rules over the recorded
 * brand config and settings: the recorded display mode `show` shows the store,
 * and the storefront address is the recorded `meta.cart.storefront_url`,
 * which this brand does not set. The group files hold the other brand states
 * (design 8.8), one per file.
 *
 * ## What Breaks If These Fail
 * A signed-in client sees the history report itself unavailable, or a store
 * control that the brand config does not ask for.
 */

import { describe, expect, it } from "vitest";
import {
  bootCollectionOnBrand,
  recordedBrandConfig,
  recordedBrandSettings
} from "./client-orders.int-helpers";

// -----------------------------------------------------------------------------

describe("client-orders — the collection reports store availability (AC-5)", () => {
  it("publishes isAvailable, the recorded show mode and the recorded storefront address", async () => {
    expect(recordedBrandConfig().data["ui.client_area.show_catalog"]).toBe(
      "show"
    );
    const meta = await bootCollectionOnBrand({});

    expect(meta.isAvailable.value).toBe(true);
    expect(meta.showStore.value).toBe(true);
    expect(meta.storefrontUrl.value).toBe(
      recordedBrandSettings().data.meta.cart.storefront_url
    );
  });
});
