// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — a disabled catalogue with a storefront
 * address keeps the store control (AC-5, D-16)
 *
 * ## Job To Be Done
 * Prove the legacy store rules read the display mode and the storefront
 * address, never `useBrand().hasStorefront`: with the catalogue disabled and
 * a storefront address set, `showStore` stays true and `storefrontUrl` keeps
 * the address.
 *
 * ## Provenance
 * Declared construction (design 8.8, "disabled catalogue with a storefront
 * address"): the recorded brand settings with three `meta.cart` keys set:
 * `storefront_url` and `@data.storeUrl` to the recorded brand origin of the
 * same capture, and `@data.*.catalogueDisabled` to `true`. One brand state
 * per file.
 *
 * ## What Breaks If These Fail
 * A brand with an external store loses its store control on the order history.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { useBrand } from "../../brand";
import {
  bootCollectionOnBrand,
  brandRecordingsDir
} from "./orders.int-helpers";

// -----------------------------------------------------------------------------

const STOREFRONT = (
  JSON.parse(
    readFileSync(join(brandRecordingsDir, "get-brand-settings.json"), "utf-8")
  ) as { request: { headers: { Origin: string } } }
).request.headers.Origin;

describe("orders — a disabled catalogue with a storefront address (AC-5)", () => {
  it("showStore true in -catalogue-disabled, and storefrontUrl keeps the address", async () => {
    expect(STOREFRONT).toMatch(/^https?:\/\//);
    const meta = await bootCollectionOnBrand({
      cart: cart => ({
        ...cart,
        storefront_url: STOREFRONT,
        "@data.storeUrl": STOREFRONT,
        "@data.*.catalogueDisabled": true
      })
    });

    expect(useBrand().hasStorefront.value).toBe(false);
    expect(meta.showStore.value).toBe(true);
    expect(meta.storefrontUrl.value).toBe(STOREFRONT);
  });
});
