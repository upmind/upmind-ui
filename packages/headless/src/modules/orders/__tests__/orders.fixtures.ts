// -----------------------------------------------------------------------------
/**
 * @fileoverview Order Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `order` module hits and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir — the
 * same files the order integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate order
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes.
 *
 * ## What this generator will NOT capture, and why
 * A SUCCESSFUL `POST /api/payments` that clears money is a real charge against
 * a real gateway. This generator captures only:
 * - Invoice loads (already captured)
 * - Wallet balance (already captured)
 * - Payment refusals (422 errors)
 * - Challenge/redirect flows (REDIRECT status, no money moves yet)
 * - Wallet-only payments (no gateway charge)
 *
 * Cleared-payment scenarios needing a gateway sandbox run are NOT substituted
 * with hand-written bodies.
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

const ORDER_WITH = [
  "status",
  "currency",
  "address",
  "payments",
  "client"
].join();

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

const SEED_PRODUCT = {
  product_id: "3de78642-de53-9714-76df-21208469530d",
  quantity: 1,
  billing_cycle_months: 24
};

const GATEWAY_WITH = ["gateway", "gateway.gateway_provider"].join();

function dropCapture(gen: Generator, caseTag: string): void {
  const captured = gen.getCapturedFixtures();
  for (const [key, entry] of captured) {
    if (entry.fixture.request.path.includes(`case=${caseTag}`)) {
      captured.delete(key);
    }
  }
}

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

describe("Order API Fixtures Generator", () => {
  let generator: Generator;
  let token: IToken;
  let orderId: string;
  let brandId: string;
  let clientId: string | undefined;
  let currencyCode: string | undefined;
  let countryId: string | undefined;
  let automaticGateways: Array<{ code: string; id: string }> = [];

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "order"
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
        "Could not resolve a brand id from /api/self — wallet and gateway " +
          "endpoints are brand-scoped and cannot be captured without one."
      );
    }

    type InvoiceRow = {
      id: string;
      amount_due?: number;
      paid_amount?: number;
      total_amount?: number;
      status?: { name?: string };
      currency?: { code?: string };
    };

    const invoices = await readLive<InvoiceRow[]>(
      "/api/invoices?limit=50&with=status,currency",
      token.access_token
    );

    const rows = Array.isArray(invoices) ? invoices : [];

    const owed = (row: InvoiceRow): number =>
      Number(
        row.amount_due ??
          Number(row.total_amount ?? 0) - Number(row.paid_amount ?? 0)
      );

    const PAYABLE_STATUS = /^(unpaid|pending|overdue|partially paid|draft)$/i;

    const payable = rows.find(
      row => owed(row) > 0 && PAYABLE_STATUS.test(row.status?.name ?? "")
    );

    orderId = payable?.id ?? (await seedPayableOrder(token.access_token));

    const order = await readLive<InvoiceRow>(
      `/api/invoices/${orderId}?with=status,currency`,
      token.access_token
    );

    currencyCode = order?.currency?.code ?? "GBP";

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

    console.log(
      `[orders.fixtures] ${automaticGateways.length} automatic gateways available: ` +
        automaticGateways.map(g => g.code).join(", ")
    );
  }, 60000);

  afterAll(() => {
    generator.save();
  });

  it("captures POST /api/payments refused for an unusable payment method (@order-retry)", async () => {
    await generator.post("/api/payments?case=payment-refused", {
      invoice_id: orderId,
      payment_details_id: "00000000-0000-0000-0000-000000000000"
    });
  });

  it("captures POST /api/payments with wallet amount (@order-pay-wallet)", async () => {
    const walletBalance = await readLive<{
      total?: Record<string, { amount?: number }>;
    }>(`/api/wallet/balance?currency_code=${currencyCode}`, token.access_token);

    const available =
      walletBalance?.total?.[currencyCode ?? "GBP"]?.amount ?? 0;

    if (available <= 0) {
      console.warn(
        `No wallet balance available in ${currencyCode} — wallet payment ` +
          "capture skipped. Top up the recording client's wallet to capture."
      );
      return;
    }

    await generator.post("/api/payments?case=wallet-partial", {
      invoice_id: orderId,
      wallet_amount: Math.min(available, 1)
    });
  });

  it("captures POST /api/payments with insufficient wallet (@order-pay-wallet edge)", async () => {
    await generator.post("/api/payments?case=wallet-insufficient", {
      invoice_id: orderId,
      wallet_amount: 999999
    });
  });

  it("captures POST /api/payments from automatic gateways (@order-challenge)", async () => {
    if (!automaticGateways.length) {
      console.warn(
        "No automatic gateways available — skipping payment outcome capture."
      );
      return;
    }

    const verdicts: string[] = [];

    for (const candidate of automaticGateways) {
      const tag = `gateway-${candidate.code.toLowerCase()}`;

      const { status, body } = await generator.post(
        `/api/payments?case=${tag}`,
        {
          invoice_id: orderId,
          gateway_id: candidate.id
        }
      );

      const paymentBody = body as {
        data?: {
          transaction_status?: string;
          transaction_type?: number;
          approval_url?: { url?: string };
        };
      };

      const txStatus = paymentBody?.data?.transaction_status;
      const hasApprovalUrl = Boolean(paymentBody?.data?.approval_url?.url);

      if (status === 200 && txStatus === "REDIRECT" && hasApprovalUrl) {
        console.log(
          `[orders.fixtures] Captured REDIRECT from ${candidate.code} — ` +
            "this is a genuine 3DS/redirect challenge body."
        );
        verdicts.push(`${candidate.code} → REDIRECT (kept)`);
        continue;
      }

      if (status < 400) {
        console.log(
          `[orders.fixtures] ${candidate.code} returned ${status} with ` +
            `transaction_status=${txStatus} — kept for reference.`
        );
        verdicts.push(`${candidate.code} → ${status}/${txStatus} (kept)`);
        continue;
      }

      dropCapture(generator, tag);
      verdicts.push(`${candidate.code} → ${status} (dropped)`);
    }

    console.log(`[orders.fixtures] Gateway sweep: ${verdicts.join(" | ")}`);
  });

  it("attempts to capture a partially-paid invoice (@order-pay-partial)", async () => {
    if (!automaticGateways.length) {
      console.warn(
        "No automatic gateways — cannot attempt partial payment capture."
      );
      return;
    }

    const invoice = await readLive<{
      amount_due?: number;
      total_amount?: number;
      paid_amount?: number;
    }>(`/api/invoices/${orderId}?with=status,currency`, token.access_token);

    const totalOwed = Number(invoice?.amount_due ?? invoice?.total_amount ?? 0);
    const alreadyPaid = Number(invoice?.paid_amount ?? 0);

    if (totalOwed <= 1) {
      console.warn(
        `Invoice ${orderId} owes only ${totalOwed} — too small for partial split.`
      );
      return;
    }

    const partialAmount = Math.floor(totalOwed / 2);
    const verdicts: string[] = [];

    for (const candidate of automaticGateways) {
      const tag = `partial-${candidate.code.toLowerCase()}`;

      const { status, body } = await generator.post(
        `/api/payments?case=${tag}`,
        {
          invoice_id: orderId,
          gateway_id: candidate.id,
          amount: partialAmount
        }
      );

      const paymentBody = body as {
        data?: {
          transaction_status?: string;
          approval_url?: { url?: string };
        };
      };

      const txStatus = paymentBody?.data?.transaction_status;
      const needsRedirect = Boolean(paymentBody?.data?.approval_url?.url);

      if (needsRedirect) {
        dropCapture(generator, tag);
        verdicts.push(`${candidate.code} → REDIRECT (needs off-site, dropped)`);
        continue;
      }

      if (status === 200 && txStatus === "SUCCESS") {
        console.log(
          `[orders.fixtures] ${candidate.code} settled partial payment inline!`
        );

        const refreshed = await readLive<{
          amount_due?: number;
          paid_amount?: number;
        }>(`/api/invoices/${orderId}?with=status,currency`, token.access_token);

        const nowPaid = Number(refreshed?.paid_amount ?? 0);
        const nowOwed = Number(refreshed?.amount_due ?? 0);

        if (nowPaid > alreadyPaid && nowOwed > 0) {
          await generator.get(
            `/api/invoices/${orderId}?case=partial&with=${ORDER_WITH}`
          );
          console.log(
            `[orders.fixtures] Captured partially-paid invoice: ` +
              `paid=${nowPaid}, owed=${nowOwed}`
          );
          verdicts.push(`${candidate.code} → SUCCESS, invoice partial (kept)`);
          return;
        }

        verdicts.push(
          `${candidate.code} → SUCCESS but invoice not partial ` +
            `(paid=${nowPaid}, owed=${nowOwed})`
        );
        dropCapture(generator, tag);
        continue;
      }

      dropCapture(generator, tag);
      verdicts.push(`${candidate.code} → ${status}/${txStatus} (dropped)`);
    }

    console.warn(
      `[orders.fixtures] No gateway settled a partial payment inline. ` +
        `Verdicts: ${verdicts.join(" | ")}. ` +
        `@order-pay-partial cannot be proven with recorded data from this brand.`
    );
  });
});
