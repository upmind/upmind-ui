// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentGateways Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `payment-gateways` module hits and (re)generate
 * their sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir
 * — the same files `payment-gateways.*.int.test.ts` replays through MSW. Run on
 * demand:
 *
 *   pnpm fixtures:generate payment-gateways
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so the `*.fixtures.ts` suffix keeps it out of the `*.test.ts` /
 * `*.int.test.ts` suites (see the package vitest configs). It has no assertions:
 * an `it()` succeeds when the capture completes.
 *
 * ## The module's API surface is two endpoints
 * Everything else each gateway does is provider-SDK work in a browser. Our API
 * surface is `gateway/frontend/tokenize-begin/{id}` and `.../tokenize-end/{id}`,
 * plus the brand gateway list that decides WHICH gateway is offered. Those are
 * what this generator captures, per gateway, at the currency/country that
 * unlocks it.
 *
 * ## The unlock matrix
 * Every custom gateway is active on this brand but gated behind a currency and
 * country pair. Swept live over 37 combinations:
 *
 *   Stripe, RazorPay  →  GBP / GB
 *   Braintree         →  EUR / DE
 *   OpenPay           →  MXN / MX
 *   MercadoPago       →  COP / CO
 *   dLocal            →  ARS / AR
 *
 * ## What this generator will NOT capture, and why
 * - **Nicky** is enabled on no currency/country pair this brand serves (swept
 *   37 combinations, zero hits), so its schema and actions have no recorded
 *   reality here. Owed on FE-3130; never substituted with a hand-written body.
 * - A tokenise-END **success** is minted by a gateway SDK running in a browser
 *   — the token is single-use and cannot be forged from Node. This generator
 *   captures tokenise-BEGIN's real payload and tokenise-END's REFUSAL shape
 *   only. The cleared-capture path needs a gateway-sandbox capture through the
 *   app-driven recorder, owed on FE-3130.
 *
 * ## Re-runnability — READ THIS BEFORE RE-RUNNING
 * NOT free. `tokenize-begin` is a POST that MINTS A REAL
 * `client_payment_details` record on the recording client, once per gateway,
 * on every run. Six orphan records accumulate each time. Every other capture
 * is a read, or a write the API refuses by design.
 *
 * Run this sparingly, and clean up the orphans afterwards. Owed on FE-3130: a
 * teardown that deletes the records this generator created.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
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

/** The relations the gateway list asks for. */
const GATEWAY_WITH = ["gateway.gateway_provider", "gateway.card_types"].join();

/**
 * The currency/country pair that unlocks each gateway on this brand, and the
 * substring that identifies its provider code in the list response.
 */
const UNLOCKS = [
  { tag: "stripe", provider: "Stripe", currency: "GBP", country: "GB" },
  { tag: "razorpay", provider: "RazorPay", currency: "GBP", country: "GB" },
  { tag: "braintree", provider: "Braintree", currency: "EUR", country: "DE" },
  { tag: "openpay", provider: "OpenPay", currency: "MXN", country: "MX" },
  {
    tag: "mercadopago",
    provider: "MercadoPago",
    currency: "COP",
    country: "CO"
  },
  { tag: "dlocal", provider: "DLocal", currency: "ARS", country: "AR" }
] as const;

type GatewayRow = {
  gateway_id?: string;
  gateway?: {
    id?: string;
    use_frontend_implementation?: boolean;
    store_outside_payment?: boolean;
    gateway_provider?: { code?: string };
  };
};

/**
 * Mint a REAL (unsanitised) token outside the capture pipeline — the Generator
 * only ever returns sanitised bodies, so an authed capture's credentials must
 * come from a plain fetch that never touches disk.
 */
async function mintToken(actor: "client"): Promise<IToken> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS[actor].username,
      password: API_CREDENTIALS[actor].password
    }).toString()
  });

  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;

  if (!token?.access_token) {
    throw new Error(
      `Could not mint a ${actor} token (${response.status}) — check ` +
        "tests/fixtures/credentials.ts against the recording brand."
    );
  }
  return token;
}

/** Read a real value off the live API without buffering a capture for it. */
async function readLive<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: ORIGIN
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`GET ${path} returned ${response.status}`);
  return (body?.data ?? body) as T;
}

// -----------------------------------------------------------------------------

describe("paymentGateways API Fixtures Generator", () => {
  let generator: Generator;
  let token: IToken;
  let brandId: string;
  let clientId: string;
  const countryIds: Record<string, string> = {};
  const gatewayIds: Record<string, string> = {};

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "payment-gateways"
    });

    token = await mintToken("client");
    generator.setBearerToken(token.access_token);

    const self = await readLive<{
      id?: string;
      actor?: { id?: string; brand_id?: string };
    }>("/api/self?with=actor,actor.brand", token.access_token);

    brandId = self?.actor?.brand_id ?? "";
    clientId = self?.actor?.id ?? self?.id ?? "";

    if (!brandId || !clientId) {
      throw new Error(
        "Could not resolve a brand id and client id from /api/self — the " +
          "gateway list is scoped to both."
      );
    }

    const countries = await readLive<{ id?: string; code?: string }[]>(
      "/api/countries?limit=0",
      token.access_token
    );
    for (const country of countries ?? []) {
      if (country.code && country.id) countryIds[country.code] = country.id;
    }

    for (const unlock of UNLOCKS) {
      const params = new URLSearchParams({
        limit: "0",
        order: "order",
        active: "1",
        client_id: clientId,
        currency_code: unlock.currency,
        with: GATEWAY_WITH
      });
      const countryId = countryIds[unlock.country];
      if (countryId) params.set("country_id", countryId);

      const rows = await readLive<GatewayRow[]>(
        `/api/brands/${brandId}/gateways?${params.toString()}`,
        token.access_token
      );

      const match = (Array.isArray(rows) ? rows : []).find(row =>
        row.gateway?.gateway_provider?.code?.includes(unlock.provider)
      );
      const id = match?.gateway_id ?? match?.gateway?.id;
      if (id) gatewayIds[unlock.tag] = id;
    }
  }, 180000);

  afterAll(() => {
    generator.save();
  });

  for (const unlock of UNLOCKS) {
    it(`captures GET /api/brands/{id}/gateways unlocking ${unlock.provider} (AC-A1)`, async () => {
      const params = new URLSearchParams({
        case: `list-${unlock.tag}`,
        limit: "0",
        order: "order",
        active: "1",
        client_id: clientId,
        currency_code: unlock.currency,
        with: GATEWAY_WITH
      });
      const countryId = countryIds[unlock.country];
      if (countryId) params.set("country_id", countryId);

      await generator.get(
        `/api/brands/${brandId}/gateways?${params.toString()}`
      );
    });

    it(`captures GET gateway/frontend details for ${unlock.provider} (AC-A1)`, async () => {
      const gatewayId = gatewayIds[unlock.tag];
      if (!gatewayId) {
        throw new Error(
          `${unlock.provider} did not appear in the gateway list at ` +
            `${unlock.currency}/${unlock.country}, so its frontend details ` +
            "cannot be captured and are not invented."
        );
      }

      const params = new URLSearchParams({
        case: `details-${unlock.tag}`,
        client_id: clientId,
        amount: "50.00",
        currency: unlock.currency,
        return_url: `${ORIGIN}/payment/return`
      });

      await generator.get(
        `/api/gateway/frontend/${gatewayId}?${params.toString()}`
      );
    });

    it(`captures POST tokenize-begin for ${unlock.provider} (AC-C2)`, async () => {
      const gatewayId = gatewayIds[unlock.tag];
      if (!gatewayId) {
        throw new Error(
          `${unlock.provider} did not appear in the gateway list at ` +
            `${unlock.currency}/${unlock.country}, so its tokenise-begin ` +
            "payload cannot be captured and is not invented."
        );
      }

      await generator.post(
        `/api/gateway/frontend/tokenize-begin/${gatewayId}?case=begin-${unlock.tag}`,
        { return_url: `${ORIGIN}/payment/return` }
      );
    });

    it(`captures POST tokenize-end refused for ${unlock.provider} (AC-C3)`, async () => {
      const gatewayId = gatewayIds[unlock.tag];
      if (!gatewayId) {
        throw new Error(
          `${unlock.provider} did not appear in the gateway list at ` +
            `${unlock.currency}/${unlock.country}, so its tokenise-end ` +
            "refusal cannot be captured and is not invented."
        );
      }

      // A tokenise-END success needs a single-use token minted by the gateway
      // SDK in a browser. The refusal shape is the reality captured here; the
      // success shape is owed on FE-3130.
      const { status } = await generator.post(
        `/api/gateway/frontend/tokenize-end/${gatewayId}?case=end-refused-${unlock.tag}`,
        { token: "not-a-real-token" }
      );

      if (status < 400) {
        throw new Error(
          `tokenise-end SUCCEEDED for ${unlock.provider} on a forged token, ` +
            "which means it stored a real method this generator did not " +
            "expect and cannot clean up."
        );
      }
    });
  }

  it("captures POST /api/clients/{id}/payment_details — the store-on-payment write (AC-C5)", async () => {
    const gatewayId = gatewayIds.stripe;
    if (!gatewayId) {
      throw new Error(
        "Stripe did not appear in the gateway list, so the store-on-payment " +
          "write has no gateway to target and is not invented."
      );
    }

    // The recording brand's store-capable gateway uses the frontend
    // implementation, so the server-side create is refused by design. The
    // refusal IS the reality captured here; the success shape is owed on
    // FE-3130 and never hand-written.
    await generator.post(
      `/api/clients/${clientId}/payment_details?case=store-on-payment`,
      {
        gateway_id: gatewayId,
        return_url: `${ORIGIN}/payment/return`,
        auto_payment: true
      }
    );
  });

  it("captures GET /api/brands/{id}/gateways with no country — the unfiltered offer (AC-A1)", async () => {
    const params = new URLSearchParams({
      case: "list-no-country",
      limit: "0",
      order: "order",
      active: "1",
      client_id: clientId,
      currency_code: "GBP",
      with: GATEWAY_WITH
    });

    await generator.get(`/api/brands/${brandId}/gateways?${params.toString()}`);
  });
});
