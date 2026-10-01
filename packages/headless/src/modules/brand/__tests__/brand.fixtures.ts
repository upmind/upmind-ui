/**
 * @fileoverview Brand API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real brand-related endpoints the brand module hits and
 * generate sanitised v3 fixtures for integration tests. Run on demand:
 *
 *   pnpm fixtures:generate brand
 *
 * ## Captures (brand.feature AC-1,2,3,4)
 * - GET /api/brand/settings (AC-1)
 * - GET /api/config/brand/values with keys= (AC-2)
 * - GET /api/config/organisation/values (AC-3)
 * - GET /api/org/modules (AC-4)
 *
 * ## The boot reads other tests replay (FE-3145, ADR 035)
 * Every signed-in test boots the brand, and the brand asks for EXACTLY
 * `defaultBrandConfigKeys` and `defaultOrgFeatureKeys` — the lists in
 * `brand.constants.ts`, read here rather than retyped, so a key added there is
 * a key recorded here. The basket's load then adds its own key
 * (`basket.services.ts`, `ensureConfig([REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS])`),
 * so that list is recorded too.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { BrandConfigKeys } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import {
  defaultBrandConfigKeys,
  defaultOrgFeatureKeys
} from "../brand.constants";
import type { IToken } from "@upmind-automation/types";

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set " +
          "it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const BRAND_CONFIG_KEYS = [
  BrandConfigKeys.BASKET_DEFAULT_CURRENCY,
  BrandConfigKeys.PRICE_DISPLAY_TYPE,
  BrandConfigKeys.DEFAULT_PAYMENT_PERIOD
].join(",");

/**
 * The address editor's accumulated config request (FE-3145, ADR 035). When the
 * `client-address` editor opens it calls `useBrand().ensureConfig([…address
 * keys…])`, which BATCHES with the boot's own key set into ONE request — the
 * boot defaults plus the basket's key (already `required_region_in_address` is
 * among the defaults) plus the one key only the editor needs,
 * `clients.settings.allow_address_update`. Recorded here, with the OWNER, in the
 * exact accumulated `keys=` order the runtime produces, so a signed-in
 * address editor's boot read is answered by the brand's own recording.
 */
const ADDRESS_CONFIG_KEYS = [
  ...defaultBrandConfigKeys,
  BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS,
  BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE
].join(",");

describe("brand fixtures generator", () => {
  let generator: Generator;
  let clientToken: IToken | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "brand"
    });
    clientToken = await mintClientToken();
  });

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/brand/settings (AC-1)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/brand/settings");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`brand/settings returned ${status}`);
    }
  });

  it("captures GET /api/config/brand/values (AC-2)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get(
      `/api/config/brand/values?keys=${encodeURIComponent(BRAND_CONFIG_KEYS)}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/brand/values returned ${status}`);
    }
  });

  it("captures GET /api/config/brand/values for the boot's key list", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get(
      `/api/config/brand/values?keys=${encodeURIComponent(defaultBrandConfigKeys.join(","))}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/brand/values (boot keys) returned ${status}`);
    }
  });

  it("captures GET /api/config/brand/values for the boot's key list plus the basket's key", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const keys = [
      ...defaultBrandConfigKeys,
      BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS
    ];
    const { status } = await generator.get(
      `/api/config/brand/values?keys=${encodeURIComponent(keys.join(","))}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `config/brand/values (boot + basket keys) returned ${status}`
      );
    }
  });

  it("captures GET /api/config/brand/values for the address editor's key list", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get(
      `/api/config/brand/values?keys=${encodeURIComponent(ADDRESS_CONFIG_KEYS)}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/brand/values (address keys) returned ${status}`);
    }
  });

  it("captures GET /api/config/organisation/values for the boot's feature keys", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get(
      `/api/config/organisation/values?keys=${encodeURIComponent(defaultOrgFeatureKeys.join(","))}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `config/organisation/values (boot keys) returned ${status}`
      );
    }
  });

  it("captures GET /api/config/organisation/values (AC-3)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/config/organisation/values");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/organisation/values returned ${status}`);
    }
  });

  it("captures GET /api/org/modules (AC-4)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/org/modules");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`org/modules returned ${status}`);
    }
  });
});
