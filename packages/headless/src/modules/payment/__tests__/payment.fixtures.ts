// -----------------------------------------------------------------------------
/**
 * @fileoverview Payment Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `payment` module hits and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir — the
 * same files the payment integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate payment
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes.
 *
 * ## What this generator will NOT capture, and why
 * A SUCCESSFUL `POST /api/payments` is a real charge against a real gateway.
 * This generator never attempts one: it captures the REFUSAL shape only, by
 * posting a real invoice with a payment detail that cannot be used (AC-10). The
 * cleared-payment scenarios (AC-4, AC-6) therefore have no fixture from here —
 * they need a gateway-sandbox capture through the app-driven recorder, which is
 * owed on FE-3130 and is NOT substituted with a hand-written body.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
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

/** The relations `payment.services.load` asks for on the order. */
const ORDER_WITH = [
  "brand",
  "taxes",
  "client",
  "gateway",
  "gateway.gateway_provider",
  "status",
  "contract",
  "payments",
  "products",
  "promotions",
  "client.tags",
  "products.tags",
  "taxes.tax_tag_data",
  "custom_fields.field",
  "affiliate_commissions",
  "products.product.image",
  "account.affiliate_referral.affiliate_account.account.client"
].join();

/** The relations the gateway lookup asks for. */
const GATEWAY_WITH = ["gateway.gateway_provider", "gateway.card_types"].join();

/** Drop a buffered capture whose recorded path carries the given case tag. */
function dropCapture(generator: Generator, caseTag: string): void {
  const captures = generator.getCapturedFixtures();
  for (const [key, { fixture }] of captures) {
    if (fixture.request.path.includes(`case=${caseTag}`)) captures.delete(key);
  }
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
  if (!response.ok) {
    throw new Error(`GET ${path} returned ${response.status}`);
  }
  return (body?.data ?? body) as T;
}

/** Write to the live API without buffering a capture for it. */
async function writeLive<T>(
  path: string,
  method: "PATCH" | "POST",
  body: unknown,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: ORIGIN
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `${method} ${path} returned ${response.status}: ${JSON.stringify(payload)}`
    );
  }
  return (payload?.data ?? payload) as T;
}

/**
 * The product and term the e2e checkout suite buys
 * (`tests/Playwright/e2e/support/constants/products.ts` → STARTER_HOSTING).
 * Reused here so the seeded order matches what the real journey creates.
 */
const SEED_PRODUCT = {
  product_id: "3de78642-de53-9714-76df-21208469530d",
  quantity: 1,
  billing_cycle_months: 24
};

/**
 * Create a fresh payable order for the recording client and return its id.
 *
 * Every invoice already on this client is Cancelled or Paid, so nothing
 * pre-existing can be charged — a seeded order is what makes this generator
 * re-runnable rather than dependent on staging happening to hold one.
 */
async function seedPayableOrder(accessToken: string): Promise<string> {
  const basket = await writeLive<{ id?: string }>(
    "/api/orders",
    "POST",
    { category_slug: "new_contract", products: [SEED_PRODUCT] },
    accessToken
  );

  if (!basket?.id) {
    throw new Error("POST /api/orders returned no basket id.");
  }

  await writeLive(`/api/orders/${basket.id}/convert`, "PATCH", {}, accessToken);

  return basket.id;
}

// -----------------------------------------------------------------------------

describe("Payment API Fixtures Generator", () => {
  let generator: Generator;
  let token: IToken;
  let brandId: string;
  let orderId: string;
  let clientId: string | undefined;
  let currencyCode: string | undefined;
  let countryId: string | undefined;
  let automaticGateways: Array<{ code: string; id: string }> = [];

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "payment"
    });

    token = await mintClientToken();
    generator.setBearerToken(token.access_token);

    const self = await readLive<{
      actor?: { brand_id?: string; id?: string };
      id?: string;
    }>("/api/self?with=actor,actor.brand", token.access_token);

    brandId = self?.actor?.brand_id ?? "";
    clientId = self?.actor?.id ?? self?.id;

    if (!brandId) {
      throw new Error(
        "Could not resolve a brand id from /api/self — the gateway endpoint " +
          "is brand-scoped and cannot be captured without one."
      );
    }

    type InvoiceRow = {
      id: string;
      amount_due?: number;
      paid_amount?: number;
      total_amount?: number;
      client_id?: string;
      status?: { name?: string };
      currency?: { code?: string };
      address?: { country_id?: string };
    };

    const invoices = await readLive<InvoiceRow[]>(
      "/api/invoices?limit=50&with=status,currency,address",
      token.access_token
    );

    const rows = Array.isArray(invoices) ? invoices : [];

    /** What is still owed on a row, however the API chose to express it. */
    const owed = (row: InvoiceRow): number =>
      Number(
        row.amount_due ??
          Number(row.total_amount ?? 0) - Number(row.paid_amount ?? 0)
      );

    // A cancelled or already-settled invoice returns 409 "Operation not allowed
    // due to invoice status", so status is part of payability, not just amount.
    const PAYABLE_STATUS = /^(unpaid|pending|overdue|partially paid|draft)$/i;

    // Prefer an existing payable order so a re-run does not litter staging;
    // seed one when there is none, which today is always the case.
    const payable = rows.find(
      row => owed(row) > 0 && PAYABLE_STATUS.test(row.status?.name ?? "")
    );

    orderId = payable?.id ?? (await seedPayableOrder(token.access_token));

    const order = await readLive<InvoiceRow>(
      `/api/invoices/${orderId}?with=status,currency,address`,
      token.access_token
    );

    clientId = order?.client_id ?? clientId;
    currencyCode = order?.currency?.code;
    countryId = order?.address?.country_id;

    // BankTransfer is the one provider that takes a payment UP without moving
    // money — the API returns instructions, so a real 200 is capturable here.
    const gatewayParams = new URLSearchParams({
      limit: "0",
      order: "order",
      active: "1",
      invoice_id: orderId
    });
    if (clientId) gatewayParams.set("client_id", clientId);
    if (currencyCode) gatewayParams.set("currency_code", currencyCode);
    if (countryId) gatewayParams.set("country_id", countryId);
    gatewayParams.set("with", GATEWAY_WITH);

    const gateways = await readLive<
      Array<{
        gateway_id?: string;
        gateway?: { gateway_provider?: { code?: string } };
      }>
    >(
      `/api/brands/${brandId}/gateways?${gatewayParams.toString()}`,
      token.access_token
    );

    const gatewayRows = Array.isArray(gateways)
      ? gateways
      : ((gateways as { data?: typeof gateways })?.data ?? []);

    const MANUAL_PROVIDERS = /^(Offline|BankTransfer)$/;

    automaticGateways = gatewayRows.flatMap(row => {
      const code = row.gateway?.gateway_provider?.code;
      const id = row.gateway_id;
      if (!code || !id || MANUAL_PROVIDERS.test(code)) return [];
      return [{ code, id }];
    });
  }, 60000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/invoices/{id} — the order and what is owed on it", async () => {
    await generator.get(`/api/invoices/${orderId}?with=${ORDER_WITH}`);
  });

  it("captures GET /api/invoices/{id} for an order that is not the client's (404/403)", async () => {
    await generator.get(
      `/api/invoices/00000000-0000-0000-0000-000000000000?case=not-mine&with=${ORDER_WITH}`
    );
  });

  it("captures GET /api/brands/{id}/gateways — the ways this brand can be paid", async () => {
    const params = new URLSearchParams({
      limit: "0",
      order: "order",
      active: "1"
    });
    params.set("invoice_id", orderId);
    if (clientId) params.set("client_id", clientId);
    if (currencyCode) params.set("currency_code", currencyCode);
    if (countryId) params.set("country_id", countryId);
    params.set("with", GATEWAY_WITH);

    await generator.get(`/api/brands/${brandId}/gateways?${params.toString()}`);
  });

  it("captures POST /api/payments refused for an unusable payment method (AC-10)", async () => {
    await generator.post("/api/payments?case=method-unusable", {
      invoice_id: orderId,
      payment_details_id: "00000000-0000-0000-0000-000000000000"
    });
  });

  it("captures POST /api/payments taken up by the provider (AC-4, AC-5)", async () => {
    if (!automaticGateways.length) {
      throw new Error(
        "This brand offers no gateway that supports automatic payments, so no " +
          "success can be captured here. Enable one on the recording brand."
      );
    }

    const verdicts: string[] = [];

    // Which of a brand's gateways will actually take a bare `gateway_id` is a
    // property of the brand's configuration, not of this module — so ask each in
    // turn and keep the first that answers, rather than hard-coding a provider.
    for (const candidate of automaticGateways) {
      const tag = `taken-up-${candidate.code.toLowerCase()}`;
      const { status } = await generator.post(`/api/payments?case=${tag}`, {
        invoice_id: orderId,
        gateway_id: candidate.id
      });

      if (status < 400) return;

      const captured = [...generator.getCapturedFixtures().values()].find(
        entry => entry.fixture.request.path.includes(`case=${tag}`)
      );
      dropCapture(generator, tag);
      verdicts.push(
        `${candidate.code} → ${status} ${JSON.stringify(
          (captured?.fixture.response.body as { error?: { data?: unknown } })
            ?.error?.data
        )}`
      );
    }

    throw new Error(
      "No gateway on this brand took the payment up from a bare gateway_id, so " +
        "no success is captured and none is invented. Every attempt was " +
        `dropped. Verdicts: ${verdicts.join(" | ")}`
    );
  });
});
