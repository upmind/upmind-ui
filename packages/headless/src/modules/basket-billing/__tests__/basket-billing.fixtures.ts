/**
 * @fileoverview Basket-billing API fixtures generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Record the real endpoints the REAL basket machine drives when it loads a
 * claimed basket and spawns its billing child, into this module's own co-located
 * `fixtures/` dir. Run on demand:
 *
 *   pnpm fixtures:generate basket-billing
 *
 * The captures, in the order the machine exercises them:
 *   - GET `/api/orders/{basketId}` — the CLAIMED basket the basket machine's
 *     `load` replays; its `client_id` is what makes the machine spawn billing.
 *   - the four brand-config endpoints the billing child's `loadLookups` reads to
 *     derive which billing fields the brand requires and to offer a schema.
 *   - PUT `/api/orders/{basketId}?case=billing` — the non-converting billing
 *     update (address/company/phone only).
 *   - GET `/api/orders/{basketId}?case=not-mine` under a DIFFERENT client's token
 *     — the real ownership denial, so the not-mine negative control replays a
 *     real 403/404 rather than a fabricated body.
 *
 * FORCED 5xx variants of the two fail-closed seams (brand bootstrap, billing
 * update) are captured with a `?case=…-server-error` discriminator — the repo's
 * flat control-variant convention (mirrors `get-…-case-not-mine` /
 * `get-…-case-absent`), which gives each a distinct identity so `lint:fixtures`
 * does not flag it as a `[dup]` of the 200. The forced variants issue the SAME
 * real (non-converting) request and override only the stored response.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the `*.test.ts` / `*.int.test.ts` suites by the
 * `*.fixtures.ts` suffix. Each `it()` succeeds when its capture completes.
 *
 * ## Staging hygiene
 * Every call is a GET or a non-converting billing PUT (address/company/phone
 * ids only). The persistent basket is never converted; no `/convert` or order
 * POST is issued, so this run consumes nothing.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { ForcedErrorCode } from "@upmind-automation/test-fixtures/types";
import { BrandConfigKeys } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintOtherClientToken
} from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

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
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it " +
          'in .env.recording). Without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

// A long-lived CLAIMED basket owned by the recording client (checkoutUser),
// created on staging by staff so it persists across runs. The basket machine's
// `load` loads THIS basket; it must never be converted (that would consume it).
const PERSISTENT_BASKET_ID = "85d26e96-783d-1652-d98f-314502e70439";

// The include set the basket machine's `load` requests (basket.services.ts
// `withRelations`) — kept here so the recorded GET matches what the machine
// replays. Drift is caught when the machine load 404s a rel.
const BASKET_WITH = [
  "address",
  "address.country",
  "currency",
  "custom_fields.field",
  "promotions",
  "taxes",
  "taxes.tax_tag_data",
  "client",
  "client.default_phone",
  "products.product.image",
  "products.product.prices",
  "products.product.category"
].join(",");

const BRAND_CONFIG_KEYS = [
  BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
  BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
  BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
  BrandConfigKeys.BASKET_DEFAULT_CURRENCY,
  BrandConfigKeys.DEFAULT_PAYMENT_PERIOD,
  BrandConfigKeys.PRICE_DISPLAY_TYPE
].join(",");

// address/company/phone only — the billing PUT never converts the basket.
const NON_CONVERTING_BILLING = {
  address_id: null,
  company_id: null,
  phone_id: null
};

// -----------------------------------------------------------------------------

describe("basket-billing fixtures generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let otherClientToken: IToken;
  const basketId = PERSISTENT_BASKET_ID;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "basket-billing"
    });
    clientToken = await mintClientToken();
    otherClientToken = await mintOtherClientToken();
  }, 60000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/orders/{basketId} (the claimed basket the machine load replays)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/orders/${basketId}?with=${encodeURIComponent(BASKET_WITH)}`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`orders/${basketId} returned ${status}`);
  });

  it("captures GET /api/brand/settings (loadLookups brand bootstrap)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/brand/settings?lang=en");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`brand/settings returned ${status}`);
  });

  it("captures GET /api/config/brand/values (the required-field flags)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/config/brand/values?keys=${encodeURIComponent(BRAND_CONFIG_KEYS)}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/brand/values returned ${status}`);
    }
  });

  it("captures GET /api/config/organisation/values (loadLookups brand bootstrap)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/config/organisation/values");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/organisation/values returned ${status}`);
    }
  });

  it("captures GET /api/org/modules (loadLookups brand bootstrap)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/org/modules");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`org/modules returned ${status}`);
  });

  it("captures GET /api/countries (the country list the basket load warms for billing)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/countries?limit=0&order=name");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`countries returned ${status}`);
  });

  it("captures GET /api/billing_cycles (the billing-cycle list the basket load warms)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/billing_cycles?limit=0");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`billing_cycles returned ${status}`);
  });

  it("captures PUT /api/orders/{basketId}?case=billing (the non-converting billing update)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.put(
      `/api/orders/${basketId}?case=billing`,
      NON_CONVERTING_BILLING
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `PUT /api/orders/${basketId} returned ${status}: ${JSON.stringify(body)}`
      );
    }
  });

  it("captures GET /api/orders/{basketId}?case=not-mine (a different client is denied)", async () => {
    generator.setBearerToken(otherClientToken.access_token);
    const { status } = await generator.get(
      `/api/orders/${basketId}?with=${encodeURIComponent(BASKET_WITH)}&case=not-mine`
    );
    generator.clearBearerToken();
    if (status !== 403 && status !== 404) {
      throw new Error(
        `expected a 403/404 ownership denial for a not-mine basket, got ${status}`
      );
    }
  });

  it("captures FORCED 5xx GET /api/brand/settings?case=server-error (loadLookups fails closed)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/brand/settings?case=server-error",
      undefined,
      ForcedErrorCode.Internal_Server_Error
    );
    generator.clearBearerToken();
    if (status !== 500)
      throw new Error(`forced brand/settings stored ${status}`);
  });

  it("captures FORCED 5xx PUT /api/orders/{basketId}?case=billing-server-error (update fails closed)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/orders/${basketId}?case=billing-server-error`,
      NON_CONVERTING_BILLING,
      undefined,
      ForcedErrorCode.Internal_Server_Error
    );
    generator.clearBearerToken();
    if (status !== 500) throw new Error(`forced billing PUT stored ${status}`);
  });
});
