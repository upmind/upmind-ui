// -----------------------------------------------------------------------------
/**
 * @fileoverview Invoices Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `invoices` module hits and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir — the
 * same files the invoices integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate invoices
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes.
 *
 * ## What this generator captures
 * `useInvoice` only ever issues `GET /invoices/{id}`. So this captures the read
 * in its settled shapes plus the two control responses:
 * - a fully-paid invoice   → get-invoices-id-case-paid
 * - an unpaid invoice      → get-invoices-id-case-unpaid
 * - a cancelled invoice    → get-invoices-id-case-cancelled
 * - an unknown id (404)    → get-invoices-id-case-not-found
 * - no bearer (401)        → get-invoices-id-case-signed-out
 *
 * The relation set is the UNION of `useInvoice`'s own read and `useOrder`'s
 * (`address`, `address.country`), so ONE captured body answers both queries for
 * the same invoice: the two modules read this endpoint under two distinct
 * TanStack keys, so the wire is hit twice (FE-3136 design §6.5a).
 *
 * No payment is submitted — this module never POSTs, so no real money moves.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { InvoiceStatus } from "@upmind-automation/types";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import { find, toNumber } from "lodash-es";
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

// The relation set useInvoice's service requests, UNIONED with useOrder's own
// (`address`, `address.country`) — so one recorded body carries every expansion
// either module maps at runtime.
const INVOICE_WITH = [
  "address",
  "address.country",
  "brand",
  "taxes",
  "client",
  "status",
  "contract",
  "payments",
  "payments.payment_details",
  "products",
  "promotions",
  "client.tags",
  "products.tags",
  "taxes.tax_tag_data",
  "custom_fields.field",
  "affiliate_commissions",
  "products.product.image",
  "account.affiliate_referral.affiliate_account.account.client"
].join(",");

type InvoiceRow = {
  id: string;
  amount_due?: number;
  paid_amount?: number;
  total_amount?: number;
  unpaid_amount?: number;
  status?: { name?: string; code?: string };
};

async function readInvoiceList(accessToken: string): Promise<InvoiceRow[]> {
  const response = await fetch(
    `${API_URL}/api/invoices?limit=50&with=status,currency`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        Origin: ORIGIN
      }
    }
  );
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`GET /api/invoices returned ${response.status}`);
  }
  const rows = (body?.data ?? body) as InvoiceRow[];
  return Array.isArray(rows) ? rows : [];
}

const owed = (row: InvoiceRow): number =>
  Number(
    row.unpaid_amount ??
      row.amount_due ??
      Number(row.total_amount ?? 0) - Number(row.paid_amount ?? 0)
  );

// A cheap, always-available catalogue product on the recording brand — the same
// seed the orders generator uses. Seeds one unpaid invoice when the client has
// none; no payment is submitted, so no money moves.
const SEED_PRODUCT = {
  product_id: "3de78642-de53-9714-76df-21208469530d",
  quantity: 1,
  billing_cycle_months: 24
};

async function writeLive(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
  accessToken: string
): Promise<{ id?: string }> {
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
  return (payload?.data ?? payload) as { id?: string };
}

async function seedPayableInvoice(accessToken: string): Promise<string> {
  const basket = await writeLive(
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

describe("Invoices API Fixtures Generator", () => {
  let generator: Generator;
  let token: IToken;
  let paidId: string | undefined;
  let unpaidId: string | undefined;
  let cancelledId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "invoices"
    });

    token = await mintClientToken();
    generator.setBearerToken(token.access_token);

    const rows = await readInvoiceList(token.access_token);

    const paidRow = find(
      rows,
      row => owed(row) <= 0 && toNumber(row.paid_amount ?? 0) > 0
    );
    const unpaidRow = find(rows, row => owed(row) > 0);
    const cancelledRow = find(
      rows,
      row => row.status?.code === InvoiceStatus.CANCELLED
    );

    paidId = paidRow?.id;
    unpaidId = unpaidRow?.id ?? (await seedPayableInvoice(token.access_token));
    cancelledId = cancelledRow?.id;
  }, 60000);

  afterAll(() => {
    generator.save();
  });

  it("captures a fully-paid invoice read (@INV-read paid)", async () => {
    if (!paidId) {
      console.warn(
        "No fully-paid invoice found on the recording client — " +
          "get-invoices-id-case-paid not captured."
      );
      return;
    }
    await generator.get(
      `/api/invoices/${paidId}?case=paid&with=${INVOICE_WITH}`
    );
  });

  it("captures an unpaid invoice read (@INV-read unpaid)", async () => {
    if (!unpaidId) {
      console.warn(
        "No unpaid invoice found on the recording client — " +
          "get-invoices-id-case-unpaid not captured."
      );
      return;
    }
    await generator.get(
      `/api/invoices/${unpaidId}?case=unpaid&with=${INVOICE_WITH}`
    );
  });

  it("captures a cancelled invoice read (@INV-read cancelled)", async () => {
    if (!cancelledId) {
      console.warn(
        "No cancelled invoice found on the recording client — " +
          "get-invoices-id-case-cancelled not captured."
      );
      return;
    }
    await generator.get(
      `/api/invoices/${cancelledId}?case=cancelled&with=${INVOICE_WITH}`
    );
  });

  it("captures an unknown-id read (404) (@INV-state-error)", async () => {
    await generator.get(
      `/api/invoices/00000000-0000-0000-0000-000000000000?case=not-found&with=${INVOICE_WITH}`
    );
  });

  it("captures an unauthenticated read (401) (@INV-guest-denied)", async () => {
    const anchorId = paidId ?? unpaidId;
    generator.clearBearerToken();
    await generator.get(
      `/api/invoices/${anchorId}?case=signed-out&with=${INVOICE_WITH}`
    );
    generator.setBearerToken(token.access_token);
  });
});
