// -----------------------------------------------------------------------------
/**
 * @fileoverview Invoices API Fixtures Generator (ADR 025 §A1.3, NFR-2)
 *
 * ## Job To Be Done
 * Capture the REAL `invoices` collection, single-invoice, and unpaid-amount
 * endpoints this story's `client x self` cell reads, into this module's own
 * co-located `fixtures/` dir — the files the integration tests replay through
 * MSW. Run on demand:
 *
 *   pnpm fixtures:generate invoices
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from `*.test.ts` / `*.int.test.ts` by the
 * `*.fixtures.ts` suffix. No assertions beyond "the capture completed and
 * returned a usable body"; `save()` in `afterAll` writes every capture once.
 *
 * ## What is captured, and why that is enough
 * The request-contract ACs (AC1, AC2, AC6, AC7, AC10, AC12) assert on the
 * OUTBOUND request the real composable builds — URL, query string, headers —
 * which holds regardless of which body the wire answers with. So a single
 * broad, real list capture plus one real single-invoice capture plus one real
 * unpaid-amount capture cover every wire-shape assertion this story needs;
 * they do not need to be captured per-scenario. AC4 (the PATCH body's key
 * presence) needs no captured response at all: a `data: null` ack is a
 * control/error response, exempt from `no-hand-rolled-int-fixture`
 * (`code-tests.companion.md`) — the assertion is on the REQUEST body, not the
 * response.
 *
 * Merged from gitlab/develop (this dispatch): develop's generator additionally
 * captured a fully-paid single-invoice read plus the two control responses
 * (unknown id / unauthenticated) for the PRE-CONVERSION flat module. Those
 * three capabilities are still real for this module (the mapper unit tests
 * carried forward in `invoices.mappers.test.ts` need a real paid row; the
 * "unaddressable" guard scenario needs a real 401 receipt) so they are folded
 * into this ONE identity flow below, captured with THIS module's actual
 * `LOAD_ONE_WITH` include set rather than develop's narrower one — the
 * capture must match what `loadOne` really requests.
 *
 * ## Capture-limitation disclosure (required by NFR-2 / the 2026-08-05 receipt)
 * This staging client's real invoice history may not contain every VM
 * condition this story maps (a genuine consolidation invoice, a genuine
 * delegated/sub-account row, a bundle over the large-bundle threshold, a
 * payment awaiting the client). Each such gap is logged to the console by
 * this generator's own assertions below rather than silently worked around;
 * the int tests that need a condition absent from the real corpus construct
 * it from a REAL captured row with ONE field toggled, exactly the accepted
 * precedent in `client-email-history.mappers.test.ts` (a bounced+error row
 * neither staging account has ever produced) — never a hand-built body
 * presented as a capture.
 *
 * ## Captures
 * `get-invoices?case=default` (broad real list, full include set, AC-2/5/6/7/8/9/11) ·
 * `get-invoices-id-case-first` (one real single-invoice read, full include set, AC-2/5/8/9/11) ·
 * `get-invoices-id-case-unpaid` (one real UNPAID/OVERDUE single-invoice read, if one exists) ·
 * `get-invoices-id-case-paid` (one real fully-paid single-invoice read, if one exists — AC-16) ·
 * `get-invoices-id-case-cancelled` (one real CANCELLED single-invoice read, if one exists) ·
 * `get-invoices-id-case-not-found` (control: unknown id, 404) ·
 * `get-invoices-id-case-signed-out` (control: unauthenticated, 401 — AC-14) ·
 * `get-invoices-unpaid_amount-id` (one real unpaid-amount read, AC-1)
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
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set " +
          "it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

// The floor (design.md "The include sets") plus this story's additions —
// the SAME set `loadOne` requests, used here only to capture a realistic
// full-shape response, never to prove the module's own request contract
// (that is the int tests' job, against the REAL composable).
const LOAD_ONE_WITH =
  "with=brand,taxes,client,status,contract,payments,payments.payment_details," +
  "products,promotions,client.tags,products.tags,taxes.tax_tag_data," +
  "custom_fields.field,affiliate_commissions,products.product.image," +
  "account.affiliate_referral.affiliate_account.account.client," +
  "address,address.country,category,payments.gateway,payments.payment_type," +
  "payment_details,gateway,client.parent_client_config,last_payment_log";

const LOAD_LIST_WITH =
  "with=client,client.image,client.parent_client_config,brand,status,category," +
  "products,last_payment_log";

// -----------------------------------------------------------------------------

describe("Invoices API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let firstInvoiceId: string | undefined;
  let unpaidInvoiceId: string | undefined;
  let unpaidInvoiceCurrencyId: string | undefined;
  let paidInvoiceId: string | undefined;
  let cancelledInvoiceId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "invoices"
    });

    clientToken = await mintClientToken();
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /invoices (broad real list, full include set, case=default)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/invoices?${LOAD_LIST_WITH}&with_count=products&limit=25&order=-create_datetime&case=default`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
    const rows = (body as { data?: Array<{ id?: string }> })?.data ?? [];
    if (rows.length === 0) {
      throw new Error(
        "The real list capture returned zero rows — this staging client has " +
          "no invoice history to capture fixtures from. Escalate rather than " +
          "hand-author a list."
      );
    }
    firstInvoiceId = rows[0]?.id;
    const asRow = (row: unknown): { status?: { code?: string } } =>
      row as { status?: { code?: string } };
    unpaidInvoiceId = rows.find(row =>
      ["invoice_unpaid", "invoice_overdue"].includes(
        asRow(row).status?.code ?? ""
      )
    )?.id;
    paidInvoiceId = rows.find(
      row => asRow(row).status?.code === "invoice_paid"
    )?.id;
    cancelledInvoiceId = rows.find(
      row => asRow(row).status?.code === InvoiceStatus.CANCELLED
    )?.id;

    // Disclosure only — never a hard failure; the int tests fall back to a
    // real-row-plus-one-toggle construction for whichever gap is logged here.
    const asRecord = (row: unknown): Record<string, unknown> =>
      row as Record<string, unknown>;
    const hasConsolidation = rows.some(
      row => asRecord(row).is_consolidation === true
    );
    const hasCreditNote = rows.some(row => {
      const category = asRecord(row).category as { slug?: string } | undefined;
      return (
        category?.slug === "credit_note" ||
        category?.slug === "credit_note_for_refund"
      );
    });
    const hasLargeBundle = rows.some(
      row => Number(asRecord(row).products_count ?? 0) > 5
    );
    const hasDelegatedOrChild = rows.some(row => {
      const client = asRecord(row).client as
        | { parent_client_config?: unknown }
        | undefined;
      return (
        asRecord(row).delegate_related === true ||
        !!client?.parent_client_config
      );
    });

    console.log(
      "[fixtures:generate invoices] real-corpus coverage — " +
        `consolidation:${hasConsolidation} creditNote:${hasCreditNote} ` +
        `largeBundle:${hasLargeBundle} delegatedOrChild:${hasDelegatedOrChild} ` +
        `paidRow:${!!paidInvoiceId}`
    );
  });

  it("captures GET /invoices/{id} (one real single-invoice read, full include set)", async () => {
    if (!firstInvoiceId) {
      throw new Error(
        "No invoice id resolved from the list capture — cannot capture the " +
          "single-read fixture."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices/${firstInvoiceId}?${LOAD_ONE_WITH}&with_count=products&case=first`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Single-read capture returned ${status}.`);
    }
  });

  it("captures GET /invoices/{id} for a real UNPAID/OVERDUE invoice, if one exists", async () => {
    if (!unpaidInvoiceId) {
      console.log(
        "[fixtures:generate invoices] no invoice_unpaid/invoice_overdue row " +
          "in this capture window — the unpaid-amount and hasUnpaid int " +
          "tests fall back to the real single-read row above."
      );
      return;
    }
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/invoices/${unpaidInvoiceId}?${LOAD_ONE_WITH}&with_count=products&case=unpaid`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Unpaid single-read capture returned ${status}.`);
    }
    unpaidInvoiceCurrencyId = (
      body as { data?: { currency_id?: string } } | null
    )?.data?.currency_id;
  });

  it("captures GET /invoices/{id} for a real fully-paid invoice, if one exists (AC-16)", async () => {
    if (!paidInvoiceId) {
      console.log(
        "[fixtures:generate invoices] no invoice_paid row in this capture " +
          "window — get-invoices-id-case-paid not (re)captured; the mapper " +
          "unit tests fall back to the last checked-in real capture."
      );
      return;
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices/${paidInvoiceId}?${LOAD_ONE_WITH}&with_count=products&case=paid`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Paid single-read capture returned ${status}.`);
    }
  });

  it("captures GET /invoices/{id} for a real CANCELLED invoice, if one exists", async () => {
    if (!cancelledInvoiceId) {
      console.log(
        "[fixtures:generate invoices] no cancelled row in this capture " +
          "window — get-invoices-id-case-cancelled not (re)captured."
      );
      return;
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices/${cancelledInvoiceId}?${LOAD_ONE_WITH}&with_count=products&case=cancelled`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Cancelled single-read capture returned ${status}.`);
    }
  });

  it("captures GET /invoices/{id} for an unknown id (404, control response)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/invoices/00000000-0000-0000-0000-000000000000?${LOAD_ONE_WITH}&case=not-found`
    );
    generator.clearBearerToken();
  });

  it("captures GET /invoices/{id} unauthenticated (401, control response — AC-14)", async () => {
    const anchorId = firstInvoiceId ?? unpaidInvoiceId;
    if (!anchorId) {
      throw new Error(
        "No invoice id resolved from the list capture — cannot capture the " +
          "signed-out control response."
      );
    }
    generator.clearBearerToken();
    await generator.get(
      `/api/invoices/${anchorId}?${LOAD_ONE_WITH}&case=signed-out`
    );
  });

  it("captures GET /invoices/unpaid_amount/{id} (one real unpaid-amount read, AC-1)", async () => {
    const targetId = unpaidInvoiceId ?? firstInvoiceId;
    if (!targetId) {
      throw new Error(
        "No invoice id resolved from the list capture — cannot capture the " +
          "unpaid-amount fixture."
      );
    }
    // The endpoint 422s without an explicit currency — real receipt captured
    // below as `get-invoices-unpaid_amount-id-422-missing-currency`, a
    // control/error response (exempt from the recorded-journey-body rule).
    generator.setBearerToken(clientToken.access_token);
    await generator.get(
      `/api/invoices/unpaid_amount/${targetId}?case=missing-currency`
    );

    const currencyId = unpaidInvoiceCurrencyId;
    if (!currencyId) {
      generator.clearBearerToken();

      console.log(
        "[fixtures:generate invoices] could not resolve a currency_id for " +
          `${targetId} — unpaid-amount 200 capture skipped, disclosed.`
      );
      return;
    }

    const { status } = await generator.get(
      `/api/invoices/unpaid_amount/${targetId}?currency_id=${currencyId}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      console.log(
        `[fixtures:generate invoices] unpaid_amount capture returned ` +
          `${status} for ${targetId} with currency_id=${currencyId} — ` +
          "disclosed, not worked around."
      );
    }
  });
});
