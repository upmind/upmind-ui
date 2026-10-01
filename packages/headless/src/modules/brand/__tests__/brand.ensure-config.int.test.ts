/**
 * @fileoverview useBrand().ensureConfig — accumulating brand-config reads (AC-2, ADR 035)
 *
 * ## Job To Be Done
 * Prove the brand-config key set ACCUMULATES across `ensureConfig` calls and the
 * request widens to match: an initial key set is fetched once; a call that adds a
 * key outside that set issues a fresh `GET /api/config/brand/values` with the
 * widened, comma-joined `keys=` list and resolves the new key's value; a further
 * new key widens again; a repeat call for a key already held is answered without
 * a new request. After the widening, `getConfigValue` reads each key added by the
 * first, second and third call from ONE merged store — proof the reads share a
 * single accumulating cache, not a per-key-set split cache.
 *
 * Every answer is a verbatim staging recording of that exact accumulated request
 * (ADR 035): the widened `keys=` list only resolves because a recording exists
 * for that precise superset — a broken accumulation would issue a request no
 * recording holds and fail as a capture gap.
 *
 * ## What Breaks If These Fail
 * The storefront re-fetches config it already holds, or a newly needed key is
 * never fetched and its setting silently reads as unset — e.g. an invoice view
 * loading without a basket never learns the zero-amount-order payment rule.
 */

import { describe, it, expect } from "vitest";
import { BrandConfigKeys } from "@upmind-automation/types";
import { useBrand } from "..";
import { defaultBrandConfigKeys } from "../brand.constants";
import { server } from "./setup.integration";
import { get } from "lodash-es";

const CONFIG_PATH = "/config/brand/values";

describe("useBrand().ensureConfig — accumulating config reads (AC-2)", () => {
  it("widens the request as new keys join and skips a re-fetch for held keys", async () => {
    if (!server) throw new Error("replay server is not running (FIXTURE_MODE)");

    const requestedKeys: string[] = [];
    server.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith(CONFIG_PATH))
        requestedKeys.push(url.searchParams.get("keys") ?? "");
    });

    const brand = useBrand();

    const initial = await brand.ensureConfig(defaultBrandConfigKeys);
    expect(requestedKeys).toHaveLength(1);
    expect(get(initial, BrandConfigKeys.PRICE_DISPLAY_TYPE)).toBe(
      "lowest_monthly_price"
    );

    const widened = await brand.ensureConfig([
      BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS
    ]);
    expect(requestedKeys).toHaveLength(2);
    const secondSet = requestedKeys[1].split(",");
    expect(secondSet).toContain(
      BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS
    );
    expect(secondSet).toContain(BrandConfigKeys.PRICE_DISPLAY_TYPE);
    expect(
      get(widened, BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS)
    ).toBe(false);

    const widenedAgain = await brand.ensureConfig([
      BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE
    ]);
    expect(requestedKeys).toHaveLength(3);
    const thirdSet = requestedKeys[2].split(",");
    expect(thirdSet).toContain(BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE);
    expect(thirdSet).toContain(
      BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS
    );
    expect(get(widenedAgain, BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE)).toBe(
      true
    );

    const held = await brand.ensureConfig([
      BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS
    ]);
    expect(requestedKeys).toHaveLength(3);
    expect(
      get(held, BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS)
    ).toBe(false);

    expect(brand.getConfigValue(BrandConfigKeys.PRICE_DISPLAY_TYPE)).toBe(
      "lowest_monthly_price"
    );
    expect(
      brand.getConfigValue(
        BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS
      )
    ).toBe(false);
    expect(
      brand.getConfigValue(BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE)
    ).toBe(true);
  });
});
