/**
 * @fileoverview Unified billing-detail lookups fixtures generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare and record the real endpoints `useUnifiedServices().loadLookups` drives
 * to populate the unified billing-detail form — the brand bootstrap, the client's
 * own addresses/phones/emails/companies, the billing cycles, the countries and
 * their regions, and (business path) the current basket and its custom fields —
 * into this module's own co-located `fixtures/` dir.
 *
 * Run headlessly (nested unit, so not via `pnpm fixtures:generate`):
 *
 *   FIXTURE_MODE=record <env from packages/headless/.env.recording> \
 *     pnpm exec vitest run --config vitest.fixtures.config.ts \
 *     src/modules/basket-billing/unified/__tests__/unified.fixtures.ts
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the `*.test.ts` / `*.int.test.ts` suites by the
 * `*.fixtures.ts` suffix. Each `it()` succeeds when its capture completes.
 *
 * ## Staging hygiene
 * Every call is a read. No mutation, no cleanup.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { BrandConfigKeys } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../../auth/__tests__/auth.tokens";
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

async function call(
  path: string,
  accessToken: string
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: ORIGIN
    }
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

// -----------------------------------------------------------------------------

describe("unified lookups fixtures generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let regionCountryId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "unified"
    });
    clientToken = await mintClientToken();
    const id = await fetchClientId(clientToken.access_token);
    if (!id) throw new Error("Could not resolve the client id from /self.");
    clientId = id;

    const countriesResp = await call(
      "/api/countries?limit=0&order=name",
      clientToken.access_token
    );
    const countries = ((
      countriesResp.body as { data?: { id: string; name: string }[] }
    )?.data ?? []) as { id: string; name: string }[];
    regionCountryId =
      countries.find(c => c.name === "Canada")?.id ??
      countries.find(c => c.name === "United States")?.id ??
      countries[0]?.id;
  }, 60000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/org/modules", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/org/modules");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`org/modules returned ${status}`);
  });

  it("captures GET /api/config/brand/values", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/config/brand/values?keys=${encodeURIComponent(BRAND_CONFIG_KEYS)}`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`config/brand/values returned ${status}`);
  });

  it("captures GET /api/brand/settings", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/brand/settings?lang=en");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`brand/settings returned ${status}`);
  });

  it("captures GET /api/config/organisation/values", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/config/organisation/values");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/organisation/values returned ${status}`);
    }
  });

  it("captures GET /api/clients/{id}/addresses", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/addresses?with=region,country&limit=0&offset=0`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`addresses returned ${status}`);
  });

  it("captures GET /api/clients/{id}/phones", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/phones?with_staged_imports=1&order=created_at&limit=0&offset=0`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`phones returned ${status}`);
  });

  it("captures GET /api/clients/{id}/emails", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/emails?order=-default,email&limit=10&offset=0`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`emails returned ${status}`);
  });

  it("captures GET /api/clients/{id}/companies", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/companies?with=address,address.country,address.region&with_staged_imports=1&order=created_at&limit=0&offset=0`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`companies returned ${status}`);
  });

  it("captures GET /api/billing_cycles", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/billing_cycles?limit=0");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`billing_cycles returned ${status}`);
  });

  it("captures GET /api/countries", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/countries?limit=0&order=name");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`countries returned ${status}`);
  });

  it("captures GET /api/countries/{id}/regions", async () => {
    if (!regionCountryId) {
      throw new Error("No country id resolved to capture regions.");
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/countries/${regionCountryId}/regions?limit=0`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`regions returned ${status}`);
  });

  it("captures GET /api/orders/current (business path)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/orders/current?with=address,currency,client,client.default_phone"
    );
    generator.clearBearerToken();
    if (status >= 400) throw new Error(`orders/current returned ${status}`);
  });

  it("captures GET /api/basket_fields (business path)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/basket_fields");
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`basket_fields returned ${status}`);
  });
});
