/**
 * @fileoverview Basket-billing API fixtures generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare and record the real endpoints `basket-billing.services.ts` drives
 * through `billing.machine.ts`, into this module's own co-located `fixtures/`
 * dir. Run on demand:
 *
 *   pnpm fixtures:generate basket-billing
 *
 * `loadLookups` bootstraps the brand config (the four brand endpoints) so it can
 * derive which billing fields the brand requires; `update` PUTs the chosen
 * address/company/phone onto the basket order. Those are the two HTTP seams the
 * integration suite replays.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the `*.test.ts` / `*.int.test.ts` suites by the
 * `*.fixtures.ts` suffix. Each `it()` succeeds when its capture completes.
 *
 * ## Staging hygiene
 * The `update` capture PUTs onto a throwaway draft basket this run creates via
 * `POST /api/orders`; the draft is never converted, so it leaves no order.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { BrandConfigKeys, GrantTypes } from "@upmind-automation/types";
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

const BRAND_CONFIG_KEYS = [
  BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
  BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
  BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
  BrandConfigKeys.BASKET_DEFAULT_CURRENCY,
  BrandConfigKeys.DEFAULT_PAYMENT_PERIOD,
  BrandConfigKeys.PRICE_DISPLAY_TYPE
].join(",");

const SEED_PRODUCT = {
  product_id: "3de78642-de53-9714-76df-21208469530d",
  quantity: 1,
  billing_cycle_months: 24
};

async function mintClientToken(): Promise<IToken> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams({
      grant_type: GrantTypes.PASSWORD,
      ...API_CREDENTIALS.client
    }).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  if (!token?.access_token) {
    throw new Error(
      `Could not mint a client token (${response.status}) — check ` +
        "tests/fixtures/credentials.ts against the recording brand."
    );
  }
  return token;
}

async function createDraftBasket(accessToken: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: ORIGIN
    },
    body: JSON.stringify({
      category_slug: "new_contract",
      products: [SEED_PRODUCT]
    })
  });
  const payload = await response.json().catch(() => null);
  const id = (payload?.data ?? payload)?.id as string | undefined;
  if (!response.ok || !id) {
    throw new Error(
      `POST /api/orders returned ${response.status}: ${JSON.stringify(payload)}`
    );
  }
  return id;
}

// -----------------------------------------------------------------------------

describe("basket-billing fixtures generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let basketId: string;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "basket-billing"
    });
    clientToken = await mintClientToken();
    basketId = await createDraftBasket(clientToken.access_token);
  }, 60000);

  afterAll(() => {
    generator.save();
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
      `/api/config/brand/values?filter[keys|eq]=${encodeURIComponent(BRAND_CONFIG_KEYS)}`
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

  it("captures PUT /api/orders/{basketId} (the billing update)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.put(
      `/api/orders/${basketId}?case=billing`,
      { address_id: null, company_id: null, phone_id: null }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `PUT /api/orders/${basketId} returned ${status}: ${JSON.stringify(body)}`
      );
    }
  });
});
