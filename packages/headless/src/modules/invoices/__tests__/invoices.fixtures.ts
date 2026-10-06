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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import {
  GrantTypes,
  InvoiceCategoryCode,
  InvoiceStatus,
  PaymentType
} from "@upmind-automation/types";
import { BrandConfigKeys } from "@upmind-automation/types";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintStaffToken,
  mintToken
} from "../../auth/__tests__/auth.tokens";
import { defaultBrandConfigKeys } from "../../brand/brand.constants";
import {
  compact,
  filter,
  find,
  forEach,
  isEmpty,
  map,
  size,
  some,
  sortBy,
  split,
  trim,
  uniq
} from "lodash-es";
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
  "payment_details,gateway,client.parent_client_config,last_payment_log," +
  "contract_product_tags&with_staged_imports=1";

const LOAD_LIST_WITH =
  "with=client,client.image,client.parent_client_config,brand,status,category," +
  "products,last_payment_log";

// The unpaid-amount read carries the BASKET currency (`withCurrency`), not the
// invoice's own — the basket the basket module's boot recording serves.
const BASKET_CURRENCY_CODE = (
  JSON.parse(
    readFileSync(
      join(
        import.meta.dirname,
        "../../basket/__tests__/fixtures/get-orders-current.json"
      ),
      "utf-8"
    )
  ) as { response: { body: { data: { currency?: { code?: string } } } } }
).response.body.data.currency?.code;

// The accumulated brand-config request the `useInvoice` DETAIL boot fires once
// via `useBrand().ensureConfig` (fix-invoices-no-basket step 16): the storefront
// default set (`defaultBrandConfigKeys`) the whole detail module graph
// accumulates, plus the basket's zero-amount-orders key and the invoices
// pay-currency gate key `billing.payment_currencies.enable_different_currency_payment`.
// Derived from the production export rather than retyped, so a key added there is
// recorded here. Captured verbatim into each detail scenario's own boot folder so
// the replay serves it (the default set alone lives in the brand module's boot
// fixtures; the gate-key widening is invoices' own, so no brand fixture holds this
// superset). `keys` is an order-insensitive identity param (`fixture-naming.mjs`
// sorts it), so the SET must match — a key added or dropped gaps the replay and
// re-records, never silently mismatches. NOT fired by the COLLECTION boot.
const DETAIL_BRAND_CONFIG_KEYS = [
  ...defaultBrandConfigKeys,
  BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS,
  BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED
].join(",");

/** The brand-config read the detail boot fires — captured into the boot folder. */
async function recordDetailBrandConfig(generator: Generator): Promise<void> {
  await generator.get(
    `/api/config/brand/values?keys=${DETAIL_BRAND_CONFIG_KEYS}`
  );
}

const STORED_METHOD_WITH = ["gateway", "client"].join();
const DETAIL_GATEWAY_WITH = [
  "gateway.gateway_provider",
  "gateway.card_types"
].join();

type WalletBalanceBody = {
  data?: {
    total?: Record<string, { amount_converted?: number }>;
    negative_allowance?: Record<string, { amount_converted?: number }>;
  };
};

/**
 * The payment-detail machine's own reads (`getPaymentDetails` / `getGateways` /
 * the account-credit `cart/calculate` posts), spawned every time the
 * `useInvoice` detail cell opens an invoice — NOT a `LOAD_ONE_WITH` field.
 * `country_id` is the INVOICE'S OWN `address.country_id` (never the client's
 * default address). The stored-method and gateway reads carry the invoice's PAY
 * currency (`payment_currency` when present, else `currency`) — the methods and
 * gateways offered depend on what the client pays in. The account-credit
 * `cart/calculate` carries the invoice's own `currency_id`, the billing
 * currency the wallet balance is held in. Silently skips when the detail body
 * carries no currency (a 404/control read never fires the machine). The exact
 * param shapes and the `cart/calculate` body derivation
 * (`payment-details.mappers.ts mapAccountCredit`) are the module's own real
 * requests, verbatim off the replay log — never guessed.
 */
async function recordPaymentDetailMachineReads(
  generator: Generator,
  brandId: string,
  clientId: string,
  invoiceId: string,
  invoiceData:
    | {
        address?: { country_id?: string } | null;
        currency?: { id?: string; code?: string };
        payment_currency?: { id?: string; code?: string } | null;
      }
    | undefined,
  walletBalanceBody: WalletBalanceBody | undefined
): Promise<void> {
  const countryId = invoiceData?.address?.country_id;
  const currencyCode = invoiceData?.currency?.code;
  const currencyId = invoiceData?.currency?.id;
  const payCode = invoiceData?.payment_currency?.code ?? currencyCode;
  if (!brandId || !clientId || !countryId || !payCode) return;

  const pdParams = new URLSearchParams({
    limit: "0",
    brand_id: brandId,
    country_id: countryId,
    currency_code: payCode,
    active: "true",
    with: STORED_METHOD_WITH,
    order: "-default,id",
    lang: "en"
  });
  await generator.get(
    `/api/clients/${clientId}/payment_details?${pdParams.toString()}`
  );

  const gwParams = new URLSearchParams({
    limit: "0",
    client_id: clientId,
    invoice_id: invoiceId,
    country_id: countryId,
    currency_code: payCode,
    active: "true",
    with: DETAIL_GATEWAY_WITH,
    order: "order",
    lang: "en"
  });
  await generator.get(`/api/brands/${brandId}/gateways?${gwParams.toString()}`);

  if (!currencyId || !currencyCode || !walletBalanceBody) return;
  const owned = Math.max(
    walletBalanceBody.data?.total?.[currencyCode]?.amount_converted ?? 0,
    0
  );
  const credit = Math.max(
    walletBalanceBody.data?.negative_allowance?.[currencyCode]
      ?.amount_converted ?? 0,
    0
  );
  await generator.post(`/api/cart/calculate?lang=en`, {
    currency_id: currencyId,
    prices: [owned, credit]
  });
}

type DetailItem = { product?: { id?: string } | null };

type DetailBody = {
  current_data?: { content?: { products?: DetailItem[] } } | null;
  products?: DetailItem[];
  currency_id?: string;
  address?: { country_id?: string } | null;
  currency?: { id?: string; code?: string };
  payment_currency?: { id?: string; code?: string } | null;
};

/**
 * The catalogue-image read the detail cell fires once for the unique product ids
 * of its items (design 8.1): snapshot items first, the live products otherwise.
 */
async function recordItemImages(
  generator: Generator,
  data: DetailBody | undefined
): Promise<void> {
  const items = data?.current_data?.content?.products || data?.products || [];
  const ids = uniq(compact(map(items, item => item.product?.id)));
  if (isEmpty(ids)) return;
  await generator.get(
    `/api/products?filter[id]=${ids.join(",")}&with=image&limit=${ids.length}&lang=en`
  );
}

/**
 * The full boot read the `useInvoice` DETAIL cell fires: the brand config it
 * accumulates via `ensureConfig`, the invoice read, the wallet balance in the
 * invoice's own `currency` (the account credit is held in the billing currency,
 * not the pay currency), the unpaid-amount read, and the payment-detail
 * machine's own reads. Shared by every detail-scenario helper so a boot read
 * added in one is recorded by all.
 */
async function recordDetailReads(
  generator: Generator,
  brandId: string,
  requestingClientId: string,
  id: string
): Promise<DetailBody | undefined> {
  await recordDetailBrandConfig(generator);
  const { body } = await generator.get(
    `/api/invoices/${id}?${LOAD_ONE_WITH}&with_count=products`
  );
  const data = (body as { data?: DetailBody })?.data;
  await recordItemImages(generator, data);
  let walletBalanceBody: WalletBalanceBody | undefined;
  if (data) {
    await generator.get("/api/wallet/balance?lang=en");
    walletBalanceBody = (
      await generator.get(
        `/api/wallet/balance?lang=en&currency_code=${data.currency?.code}`
      )
    ).body as WalletBalanceBody;
  }
  await generator.get(
    `/api/invoices/unpaid_amount/${id}?lang=en&currency_code=${BASKET_CURRENCY_CODE}`
  );
  await recordPaymentDetailMachineReads(
    generator,
    brandId,
    requestingClientId,
    id,
    data,
    walletBalanceBody
  );
  return data;
}

// -----------------------------------------------------------------------------

describe("Invoices API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
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
    clientId = await resolveClientId(clientToken.access_token);
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
    const asRow = (row: unknown): { status?: { code?: string } } =>
      row as { status?: { code?: string } };
    const asRecordRow = (row: unknown): Record<string, unknown> =>
      row as Record<string, unknown>;

    // Exclude the invoices this generator ARRANGES (arranged-invoices.json) from
    // the flat mapper-fixture selection: an arranged pay-later invoice carries
    // no captured payment, no saved card and no assigned method, so it would
    // starve the pure mapper tests of the facts they prove. Select each flat
    // capture by that fact, never by "first" (regression fix 2026-09-26).
    const arrangedIds = await resolveArrangedIds(clientToken.access_token);
    const rowId = (row: unknown): string | undefined =>
      asRecordRow(row).id as string | undefined;
    const detailOf = async (
      id: string
    ): Promise<{
      payment_details?: { card_type?: string | null } | null;
      products?: unknown[];
      payments?: Array<{
        pending?: boolean;
        payment_details?: { card_type?: string | null } | null;
      }>;
    } | null> => {
      const { body } = await selfCall(
        `/api/invoices/${id}?${LOAD_ONE_WITH}&with_count=products`,
        clientToken.access_token
      );
      return (body as { data?: never })?.data ?? null;
    };

    // case-paid must carry a captured (non-pending) card payment AT INDEX 0 —
    // the exact fact invoices.mappers.test.ts reads (`payments[0].payment_details`,
    // never a `.some()` match buried further in the array) — AND an assigned
    // payment method with a card. Select each flat capture by that fact, never
    // by "first" (regression fix 2026-09-26; index-0 fix 2026-09-28).
    for (const row of rows) {
      const id = rowId(row);
      if (
        !id ||
        arrangedIds.has(id) ||
        asRow(row).status?.code !== "invoice_paid" ||
        Number(asRecordRow(row).total_amount ?? 0) <= 0
      )
        continue;
      const d = await detailOf(id);
      const assignedCard = !!d?.payment_details?.card_type;
      const firstPayment = d?.payments?.[0];
      const capturedCardPayment =
        firstPayment?.pending === false &&
        !!firstPayment?.payment_details?.card_type;
      if (assignedCard && capturedCardPayment) {
        paidInvoiceId = id;
        break;
      }
    }

    // No corpus row qualifies — CREATE one: order+convert a fresh product,
    // then a STAFF manual payment against the client's own saved card
    // (`payment_details_id`, never a raw `gateway_id`) so the resulting
    // payment carries real `payment_details` at index 0 (operator ruling
    // 2026-09-28 — never scan and hope; create the fact the test needs).
    if (!paidInvoiceId) {
      const savedCard = await arrangeCall(
        "GET",
        `/api/clients/${clientId}/payment_details?limit=1&active=true`,
        clientToken.access_token
      );
      const savedCardId = (savedCard.body as { data?: Array<{ id?: string }> })
        ?.data?.[0]?.id;
      if (savedCardId) {
        const forPaid = await orderRecurringContract(clientToken.access_token);
        if (forPaid.invoiceId && forPaid.currencyId) {
          const staffToken = await mintStaffToken();
          const invRead = await arrangeCall(
            "GET",
            `/api/invoices/${forPaid.invoiceId}`,
            clientToken.access_token
          );
          const totalAmount =
            (invRead.body as { data?: { total_amount?: number } })?.data
              ?.total_amount ?? 1;
          const pay = await arrangeCall(
            "POST",
            "/api/admin/payments/manual",
            staffToken.access_token,
            {
              invoice_id: forPaid.invoiceId,
              client_id: clientId,
              amount: Math.max(1, Number(totalAmount || 1)),
              payment_details_id: savedCardId,
              currency_id: forPaid.currencyId
            }
          );
          console.log(
            `[fixtures:generate invoices] case-paid create: pay ${pay.status} body:${JSON.stringify(pay.body).slice(0, 300)}`
          );
          const d = await detailOf(forPaid.invoiceId);
          const firstPayment = d?.payments?.[0];
          console.log(
            `[fixtures:generate invoices] case-paid create: assignedCard:${!!d?.payment_details?.card_type} firstPayment.card:${!!firstPayment?.payment_details?.card_type}`
          );
          if (
            d?.payment_details?.card_type &&
            firstPayment?.pending === false &&
            firstPayment?.payment_details?.card_type
          ) {
            paidInvoiceId = forPaid.invoiceId;
          }
        }
      } else {
        console.log(
          "[fixtures:generate invoices] case-paid create: client has no saved card — cannot arrange."
        );
      }
    }

    // case-unpaid must carry line items AND no assigned method (AC-4 "None
    // selected"), which the bundle/attribution mapper tests also read from.
    for (const row of rows) {
      const id = rowId(row);
      if (
        !id ||
        arrangedIds.has(id) ||
        !["invoice_unpaid", "invoice_overdue"].includes(
          asRow(row).status?.code ?? ""
        )
      )
        continue;
      const d = await detailOf(id);
      if ((d?.products?.length ?? 0) > 0 && !d?.payment_details) {
        unpaidInvoiceId = id;
        break;
      }
    }

    // None qualifies — CREATE a fresh unpaid invoice (order + convert pay-later).
    if (!unpaidInvoiceId)
      unpaidInvoiceId = (await orderRecurringContract(clientToken.access_token))
        .invoiceId;

    firstInvoiceId =
      paidInvoiceId ?? rows.find(row => !arrangedIds.has(rowId(row) ?? ""))?.id;
    cancelledInvoiceId = rows.find(
      row => asRow(row).status?.code === InvoiceStatus.CANCELLED
    )?.id;
    // None exists — CREATE one: a fresh order cancelled by staff, the legacy
    // admin cancel (vue-app store/modules/data/invoices/index.ts:313-320).
    if (!cancelledInvoiceId) {
      const forCancel = await orderRecurringContract(clientToken.access_token);
      if (forCancel.invoiceId) {
        const cancelled = await arrangeCall(
          "PATCH",
          `/api/admin/orders/${forCancel.invoiceId}/cancel`,
          await mintStaffToken(),
          {}
        );
        if (cancelled.status < 400) cancelledInvoiceId = forCancel.invoiceId;
      }
    }

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

  // The collection read exactly as the labs page's boot issues it: the client's
  // own `client_id` param and the `limit=10` window (`with`/`with_count`/`order`/
  // `limit` are excluded from the fixture name, `client_id` is its identity), so
  // the forced-state corpus answers the page's real read by identity (FE-3145).
  it("captures GET /invoices?client_id={id} (labs page boot read)", async () => {
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices?${LOAD_LIST_WITH}&with_count=products&order=-create_datetime&limit=10`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Boot-read list capture returned ${status}.`);
    }
  });

  // The two dedicated count reads the collection fires the first time its meta's
  // `hasUnpaid` / `consolidatableCount` are dereferenced (both `limit=1`). The
  // labs `module-port-raw-meta-requests` spec proves the dereference fires them;
  // they must be answerable flat fixtures so the replay wall does not fail the
  // read the spec is observing (FE-3031, FE-3145).
  it("captures GET /invoices (hasUnpaid dedicated count read)", async () => {
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices?order=-create_datetime&limit=1` +
        `&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted` +
        `&filter[client_id]=${clientId}`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Unpaid-count capture returned ${status}.`);
  });

  it("captures GET /invoices (consolidatableCount dedicated count read)", async () => {
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices?order=-create_datetime&limit=1` +
        `&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted` +
        `&filter[is_consolidation]=0&filter[category.slug]=recurrent` +
        `&filter[paid_amount]=0&filter[client_id]=${clientId}`
    );
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Consolidatable-count capture returned ${status}.`);
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

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035) — one recording per driveable `invoices.feature`
// scenario, one fixtures folder per step, named from the feature by
// `recordedStepDir`. Both cells are recorded: the collection (`useInvoices`)
// scenarios and the single-read (`useInvoice`) scenarios, booted by id.
//
// These scenarios read the client's own real corpus — filter, sort, page,
// credit-notes preset, one invoice's detail. The one exception is the settle
// step, which first arranges a staff manual payment. `Never flip a value
// inside a recording` (operator ruling 2026-09-24): the recorded rows are
// whatever staging returned for that exact request.
// -----------------------------------------------------------------------------

const scenarioFeature = readFileSync(
  join(import.meta.dirname, "invoices.feature"),
  "utf-8"
);

/** The Background step every scenario opens with — it reads the collection. */
const BG = "I am an authenticated client reading my invoices";

/** Plain, UNCAPTURED authed call — used only for client-id resolution. */
async function selfCall(
  path: string,
  accessToken: string
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

async function resolveClientId(accessToken: string): Promise<string> {
  const { body } = await selfCall("/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id ?? "";
}

describe("Invoices scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let brandId: string;
  const prepared = new Set<string>();

  // The collection's SELF read seeds the target client as a plain `client_id`
  // param; only the gated count presets seed it as a `filter[client_id]` column.
  // Both shapes are the composable's own — recorded, never guessed.
  const listUrl = (extra = ""): string =>
    `/api/invoices?${LOAD_LIST_WITH}` +
    `&with_count=products&order=-create_datetime${extra}`;

  /** The unpaid-existence count read the collection fires when `hasUnpaid` is read. */
  const UNPAID_STATUS = "invoice_unpaid,invoice_overdue,invoice_adjusted";
  const unpaidCountUrl = (): string =>
    `/api/invoices?order=-create_datetime&limit=1` +
    `&filter[status.code]=${UNPAID_STATUS}&filter[client_id]=${clientId}`;

  /** The consolidatable count read the collection fires when `consolidatableCount` is read. */
  const consolidatableCountUrl = (): string =>
    `/api/invoices?order=-create_datetime&limit=1` +
    `&filter[status.code]=${UNPAID_STATUS}&filter[is_consolidation]=0` +
    `&filter[category.slug]=recurrent&filter[paid_amount]=0` +
    `&filter[client_id]=${clientId}`;

  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, scenarioFeature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        scenarioFeature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "invoices"
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  /**
   * The full boot read a signed-in collection makes: the list, plus the two
   * gated count reads (`hasUnpaid`, `consolidatableCount`) that fire the first
   * time a scenario reads the collection's meta. Recorded into the Background
   * folder so every scenario's boot is answered from its own recording.
   */
  const recordBoot = async (generator: Generator): Promise<void> => {
    await generator.get(listUrl());
    await generator.get(unpaidCountUrl());
    await generator.get(consolidatableCountUrl());
  };

  /** Records one detail scenario's Given step through the shared detail-reads helper. */
  async function recordDetail(
    scenario: string,
    step: string,
    id: string
  ): Promise<void> {
    return recordStep(scenario, step, generator =>
      recordDetailReads(generator, brandId, clientId, id)
    );
  }

  /** First row id (and currency) the given server-side query returns, uncaptured. */
  type WireRow = { id?: string; currency_id?: string; products_count?: number };
  async function firstRow(query: string): Promise<WireRow> {
    const { body } = await selfCall(
      `/api/invoices?client_id=${clientId}&${query}`,
      clientToken.access_token
    );
    return ((body as { data?: WireRow[] })?.data ?? [])[0] ?? {};
  }

  // The state-specific ids each detail scenario opens — resolved LIVE from the
  // real corpus so a re-record picks whatever staging currently holds, never a
  // copied literal. A state the corpus lacks fails its step by name.
  const detailIds: {
    primary?: string;
    primaryCurrency?: string;
    consolidation?: string;
    creditNote?: string;
    largeBundle?: string;
    overdue?: string;
  } = {};

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = await resolveClientId(clientToken.access_token);
    brandId = await resolveBrandId(clientToken.access_token);
    if (!clientId)
      throw new Error(
        "Could not resolve the client id from /self — cannot record the " +
          "invoices scenarios."
      );

    const overdue = await firstRow(
      "filter[status.code]=invoice_overdue&order=-create_datetime"
    );
    const { body: withPayments } = await selfCall(
      `/api/invoices?client_id=${clientId}&with=payments&order=-create_datetime&limit=500` +
        "&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted",
      clientToken.access_token
    );
    const pendingFirst = find(
      (
        withPayments as {
          data?: Array<WireRow & { payments?: Array<{ pending?: boolean }> }>;
        }
      )?.data,
      row => row.payments?.[0]?.pending === true
    );
    if (!pendingFirst)
      throw new Error(
        "No open invoice of the client holds a pending payment first — the " +
          '"Read one of my invoices in full" scenario reads one. Escalate.'
      );
    const primary = pendingFirst;
    detailIds.overdue = overdue.id;
    detailIds.primary = primary.id;
    detailIds.primaryCurrency = primary.currency_id;
    detailIds.consolidation = (
      await firstRow("filter[is_consolidation]=1&order=-create_datetime")
    ).id;
    detailIds.creditNote = (
      await firstRow("filter[category.slug]=credit_note&order=-create_datetime")
    ).id;

    // Large-bundle detail (AC-6): the invoice with the MOST line items
    // (products_count — the platform's own count that `isLarge` reads), scanned
    // over a wide window PLUS the consolidations (which bundle line items from
    // several invoices and out-count any single order), excluding the
    // single-product invoices this generator arranges (regression fix 2026-09-26).
    const arrangedIds = await resolveArrangedIds(clientToken.access_token);
    const listQuery = (extra: string): string =>
      `/api/invoices?${LOAD_LIST_WITH}` +
      `&with_count=products&order=-create_datetime&limit=100${extra}`;
    const { body: general } = await selfCall(
      listQuery(""),
      clientToken.access_token
    );
    const { body: consolidations } = await selfCall(
      listQuery("&filter[is_consolidation]=1"),
      clientToken.access_token
    );
    const merged = [
      ...((general as { data?: WireRow[] })?.data ?? []),
      ...((consolidations as { data?: WireRow[] })?.data ?? [])
    ];
    const byCount = sortBy(
      merged.filter(r => r.id && !arrangedIds.has(r.id)),
      r => -Number(r.products_count ?? 0)
    );
    detailIds.largeBundle = byCount[0]?.id;
    console.log(
      `[fixtures:generate invoices] largeBundle=${detailIds.largeBundle ?? "NONE"} ` +
        `(top products_count=${Number(byCount[0]?.products_count ?? 0)})`
    );
  }, 60000);

  // --- scenarios that read the collection and change nothing ---------------

  describe("Filter my invoice list to what I need", () => {
    const scenario = "Filter my invoice list to what I need";
    const filterStep =
      "I filter my invoice list by status, then add a category filter, then an amount or a date filter";
    const page = "&limit=10&offset=0";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(filterStep, async () => {
      const status = `&filter[status.code]=${InvoiceStatus.PAID}`;
      const category = `&filter[category.slug]=${InvoiceCategoryCode.RECURRENT}`;
      const { body } = await selfCall(
        `/api/invoices?client_id=${clientId}&order=-create_datetime&limit=1${status}${category}`,
        clientToken.access_token
      );
      const amount = (body as { data?: Array<{ total_amount?: number }> })
        ?.data?.[0]?.total_amount;
      if (amount === undefined)
        throw new Error(`${scenario}: no paid recurring invoice to narrow to.`);
      return recordStep(scenario, filterStep, async generator => {
        await generator.get(listUrl(status + page));
        await generator.get(listUrl(status + category + page));
        await generator.get(
          listUrl(`${status}${category}&filter[total_amount]=${amount}${page}`)
        );
      });
    });
  });

  describe("Sort my invoice list", () => {
    const scenario = "Sort my invoice list";
    const pageTwoStep =
      "I am on page two of my invoice list, most recently created first";
    const sortStep = "I sort my invoice list by due date, newest first";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(pageTwoStep, () =>
      recordStep(scenario, pageTwoStep, generator =>
        generator.get(listUrl("&limit=10&offset=10"))
      )
    );
    it(sortStep, () =>
      recordStep(scenario, sortStep, generator =>
        generator.get(
          `/api/invoices?${LOAD_LIST_WITH}` +
            "&with_count=products&order=-due_date&limit=10&offset=10"
        )
      )
    );
  });

  describe("Page through my invoice list", () => {
    const scenario = "Page through my invoice list";
    const openStep = "I open my invoice list";
    const nextStep =
      "asking for the next page of my invoices gives me the next page";

    // Page one and page two carry different rows, so the walk is provable — the
    // first-page read is the smaller `limit=10` window the collection boots on.
    const pageUrl = (offset: number): string =>
      listUrl(`&limit=10&offset=${offset}`);

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(openStep, () =>
      recordStep(scenario, openStep, generator => generator.get(pageUrl(0)))
    );
    it(nextStep, () =>
      recordStep(scenario, nextStep, generator => generator.get(pageUrl(10)))
    );
  });

  describe("See a payment's outcome reflected without a manual reload", () => {
    const scenario =
      "See a payment's outcome reflected without a manual reload";
    const settleStep = "that payment settles or fails";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(settleStep, async () => {
      // Operator ruling 2026-09-28: never a real third-party gateway payment
      // in an integration test. A CLIENT-initiated payment cannot be created
      // on this brand without one (verbatim evidence on arrangeSettledInvoice)
      // — settle with a STAFF manual payment instead, then re-record the list
      // so the settle step's recording genuinely carries the new payment row.
      const paidInvoiceId = await arrangeSettledInvoice(
        clientToken.access_token
      );
      if (!paidInvoiceId)
        throw new Error(`${scenario}: no settled payment landed.`);
      return recordStep(scenario, settleStep, recordBoot);
    });
  });

  describe("Read my credit notes as a filtered view of my invoices", () => {
    const scenario = "Read my credit notes as a filtered view of my invoices";
    const askStep = "I ask for my credit notes";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(askStep, () =>
      recordStep(scenario, askStep, generator =>
        generator.get(
          listUrl("&filter[category.slug]=credit_note,credit_note_for_refund")
        )
      )
    );
  });

  // The undeclared filter is refused CLIENT-SIDE by the query schema, so only
  // the Background list read reaches the wire — the refused step records
  // nothing (a `.gitkeep` step), which is the point AC-15 proves.
  describe("Refuse an undeclared filter, and never let one bypass the declared criteria", () => {
    const scenario =
      "Refuse an undeclared filter, and never let one bypass the declared criteria";

    it(BG, () => recordStep(scenario, BG, recordBoot));
  });

  // AC-10 — the unpaid-existence count (`hasUnpaid`) fires the first time the
  // collection's meta is read, so `recordBoot` already captures it into the
  // Background folder; the "ask" and "told" steps issue no further request.
  describe("Find out whether I owe anything at all", () => {
    const scenario = "Find out whether I owe anything at all";

    it(BG, () => recordStep(scenario, BG, recordBoot));
  });

  // AC-2 — the consolidatable count fires the first time the collection's meta's
  // `consolidatableCount` is read, so `recordBoot` already captures it into the
  // Background folder; the "ask" and "told" steps issue no further request.
  describe("See how many of my invoices could be consolidated", () => {
    const scenario = "See how many of my invoices could be consolidated";

    it(BG, () => recordStep(scenario, BG, recordBoot));
  });

  // --- detail-cell scenarios (useInvoice, booted by id via WorldScope.id) ----
  // Each opens ONE invoice whose real state the scenario needs, by an id
  // resolved LIVE from the corpus. A state the corpus lacks fails the step.

  describe("Read one of my invoices in full", () => {
    const scenario = "Read one of my invoices in full";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("one of my invoices", () => {
      if (!detailIds.primary)
        throw new Error(`${scenario}: no invoice row in the corpus.`);
      return recordDetail(scenario, "one of my invoices", detailIds.primary!);
    });
  });

  describe("Read the consolidation identity and credit fields of a merged invoice", () => {
    it(BG, () =>
      recordStep(
        "Read the consolidation identity and credit fields of a merged invoice",
        BG,
        recordBoot
      )
    );
    it("one of my invoices was merged into a consolidation", () => {
      if (!detailIds.consolidation)
        throw new Error(
          "Read the consolidation identity and credit fields of a merged invoice: no consolidation row in the corpus."
        );
      return recordDetail(
        "Read the consolidation identity and credit fields of a merged invoice",
        "one of my invoices was merged into a consolidation",
        detailIds.consolidation!
      );
    });
  });

  describe("Read a consolidated invoice's line items grouped by subscription", () => {
    it(BG, () =>
      recordStep(
        "Read a consolidated invoice's line items grouped by subscription",
        BG,
        recordBoot
      )
    );
    it("a consolidated invoice with line items from more than one subscription", () => {
      if (!detailIds.consolidation)
        throw new Error(
          "Read a consolidated invoice's line items grouped by subscription: no consolidation row in the corpus."
        );
      return recordDetail(
        "Read a consolidated invoice's line items grouped by subscription",
        "a consolidated invoice with line items from more than one subscription",
        detailIds.consolidation!
      );
    });
  });

  describe("Know a bundle is large without counting a truncated line-item array", () => {
    it(BG, () =>
      recordStep(
        "Know a bundle is large without counting a truncated line-item array",
        BG,
        recordBoot
      )
    );
    it("a consolidated invoice bundling more line items than the platform returns in one page", () => {
      if (!detailIds.largeBundle)
        throw new Error(
          "Know a bundle is large without counting a truncated line-item array: no large-bundle row in the corpus."
        );
      return recordDetail(
        "Know a bundle is large without counting a truncated line-item array",
        "a consolidated invoice bundling more line items than the platform returns in one page",
        detailIds.largeBundle!
      );
    });
  });

  describe("Tie a credit note back to the invoice it credits", () => {
    it(BG, () =>
      recordStep(
        "Tie a credit note back to the invoice it credits",
        BG,
        recordBoot
      )
    );
    it("one of my credit notes", () => {
      if (!detailIds.creditNote)
        throw new Error(
          "Tie a credit note back to the invoice it credits: no credit-note row in the corpus."
        );
      return recordDetail(
        "Tie a credit note back to the invoice it credits",
        "one of my credit notes",
        detailIds.creditNote!
      );
    });
  });

  describe("A failed invoice load reports no guessed payment state", () => {
    const scenario = "A failed invoice load reports no guessed payment state";
    const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("an invoice load that failed", () =>
      recordDetail(scenario, "an invoice load that failed", UNKNOWN_ID));
  });
});

// -----------------------------------------------------------------------------
// DELEGATE + PAY-CURRENCY SCENARIOS (FE-3145, ADR 035) — AC-1's "open in the pay
// currency the platform holds" (an invoice whose `payment_currency` differs from
// its own `currency`, arranged by turning the brand's different-currency-payment
// gate ON and setting the account's preferred payment currency) and AC-12/AC-13's
// delegated reads (the delegate MEMBER reading a client it is entitled to,
// `delegate_related:true` — `credentials.ts`). The owner's own invoice is
// arranged through the owner's real order flow; the gate and the account
// preference are restored after the recording (ADR-035 §3).
// -----------------------------------------------------------------------------

type WireInvoiceRow = {
  id?: string;
  currency_id?: string;
  delegate_related?: boolean;
};

/** Plain uncaptured authed GET returning a row list — id/currency resolution. */
async function lookupRows(
  path: string,
  accessToken: string
): Promise<WireInvoiceRow[]> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const body = (await response.json().catch(() => null)) as {
    data?: WireInvoiceRow[];
  } | null;
  return body?.data ?? [];
}

/** The single actor id behind a token, resolved from `/self`. */
async function lookupActorId(accessToken: string): Promise<string | undefined> {
  const response = await fetch(`${API_URL}/api/self?with=actor`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const body = (await response.json().catch(() => null)) as {
    data?: { id?: string; actor?: { id?: string } };
  } | null;
  return body?.data?.actor?.id ?? body?.data?.id;
}

/**
 * A client this token is entitled to act for, OTHER than `exclude` (the acting
 * client itself) — so a retarget reads a genuinely different client's invoices.
 */
async function lookupDelegatedClientId(
  accessToken: string,
  exclude: string
): Promise<string | undefined> {
  const response = await fetch(`${API_URL}/api/self?with=actor,delegated_ids`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const body = (await response.json().catch(() => null)) as {
    data?: { delegated_ids?: { client?: string[] } };
  } | null;
  const clients = body?.data?.delegated_ids?.client ?? [];
  return clients.find(id => id !== exclude) ?? clients[0];
}

// --- arranged-invoice creation (find on staging by real field, create only when absent) -

/** Real staging product ids (tests/Playwright/e2e/support/constants/products.ts). */
const ARRANGE_PRODUCTS = {
  free: "4d036794-24d0-e710-746a-3153698d582e",
  recurring: "3de78642-de53-9714-76df-21208469530d"
} as const;

/** Uncaptured authed call — arrangement + id resolution, never recorded. */
async function arrangeCall(
  method: string,
  path: string,
  accessToken: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

/**
 * Finds a real invoice already carrying the given product, on the token's own
 * account — by the product id it arranges with, optionally narrowed by a
 * `match` predicate over the invoice's own real fields (status, paid amount,
 * …). No state file: every call re-asks staging.
 */
async function findArrangedInvoice(
  accessToken: string,
  productId: string,
  match?: (invoice: Record<string, unknown>) => boolean
): Promise<string | undefined> {
  const rows = await lookupRows(
    `/api/invoices?filter[products.product_id]=${productId}&limit=25`,
    accessToken
  );
  for (const row of rows) {
    if (!row.id) continue;
    if (!match) return row.id;
    const read = await arrangeCall(
      "GET",
      `/api/invoices/${row.id}`,
      accessToken
    );
    const invoice = (read.body as { data?: Record<string, unknown> })?.data;
    if (invoice && match(invoice)) return row.id;
  }
  return undefined;
}

/**
 * The id of an invoice carrying the given product — found on staging by that
 * product id (and `match`, when the caller needs a specific real state), and
 * arranged through the real client order→convert(pay-later) flow only when
 * none is found (operator ruling 2026-09-26 — no cancellation; operator
 * ruling 2026-09-28 — find by real field, never a committed state file).
 */
async function ensureArrangedInvoice(
  accessToken: string,
  productId: string,
  billingCycleMonths: number,
  match?: (invoice: Record<string, unknown>) => boolean
): Promise<string | undefined> {
  const existing = await findArrangedInvoice(accessToken, productId, match);
  if (existing) return existing;
  const create = await arrangeCall("POST", "/api/orders", accessToken, {
    category_slug: "new_contract",
    products: [
      {
        product_id: productId,
        quantity: 1,
        billing_cycle_months: billingCycleMonths
      }
    ]
  });
  const basketId = (create.body as { data?: { id?: string } })?.data?.id;
  if (!basketId) return undefined;
  const convert = await arrangeCall(
    "PATCH",
    `/api/orders/${basketId}/convert`,
    accessToken,
    { type: PaymentType.PAY_LATER, amount: 0 }
  );
  return (convert.body as { data?: { id?: string } })?.data?.id;
}

/**
 * Every real invoice this generator arranges through the order→convert flow,
 * found by the product id it arranges with — never a committed state file.
 */
async function resolveArrangedIds(accessToken: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const productId of Object.values(ARRANGE_PRODUCTS)) {
    const rows = await lookupRows(
      `/api/invoices?filter[products.product_id]=${productId}&limit=25`,
      accessToken
    );
    for (const row of rows) if (row.id) ids.add(row.id);
  }
  return ids;
}

/**
 * A partly-paid invoice of the client's: a fresh unpaid recurring invoice with a
 * STAFF manual payment (`POST /api/admin/payments/manual`) for HALF the total —
 * the only way to arrange a partial state on staging (a client payment auto-
 * settles the whole charge or leaves no row). Reused from the manifest while it is
 * genuinely partial (0 < paid < total); re-minted when it is not.
 */
async function arrangePartlyPaid(
  clientAccessToken: string,
  clientId: string
): Promise<string | undefined> {
  const OFFLINE_GATEWAY = "4d036794-24d0-e710-275c-3153698d582e";
  type Inv = {
    paid_amount?: number;
    unpaid_amount?: number;
    total_amount?: number;
    currency_id?: string;
  };
  const readInv = async (id: string): Promise<Inv | undefined> =>
    (
      (await arrangeCall("GET", `/api/invoices/${id}`, clientAccessToken)) as {
        body?: { data?: Inv };
      }
    ).body?.data;
  const isPartial = (i: Inv | undefined): boolean =>
    Number(i?.paid_amount ?? 0) > 0 && Number(i?.unpaid_amount ?? 0) > 0;

  const id = await ensureArrangedInvoice(
    clientAccessToken,
    ARRANGE_PRODUCTS.recurring,
    24,
    invoice => isPartial(invoice as Inv)
  );
  if (!id) return undefined;
  const inv = await readInv(id);
  if (isPartial(inv)) return id;

  const staffToken = await mintStaffToken();
  await arrangeCall(
    "POST",
    "/api/admin/payments/manual",
    staffToken.access_token,
    {
      invoice_id: id,
      client_id: clientId,
      amount: Math.max(1, Math.floor(Number(inv?.total_amount ?? 0) / 2)),
      gateway_id: OFFLINE_GATEWAY,
      currency_id: inv?.currency_id
    }
  );
  return id;
}

describe("Invoices delegate + pay-currency scenario recordings", () => {
  let clientToken: IToken;
  let memberToken: IToken | undefined;
  let clientId: string;
  let brandId: string;
  let ownerId: string | undefined;
  let delegatedInvoiceId: string | undefined;
  let ownInvoiceId: string | undefined;
  const prepared = new Set<string>();

  const listUrlFor = (id: string, extra = ""): string =>
    `/api/invoices?${id === clientId ? "" : `client_id=${id}&`}${LOAD_LIST_WITH}` +
    `&with_count=products&order=-create_datetime${extra}`;
  const unpaidCountUrlFor = (id: string): string =>
    `/api/invoices?${id === clientId ? "" : `client_id=${id}&`}order=-create_datetime&limit=1` +
    `&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted&filter[client_id]=${id}`;
  const consolidatableCountUrlFor = (id: string): string =>
    `/api/invoices?${id === clientId ? "" : `client_id=${id}&`}order=-create_datetime&limit=1` +
    `&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted&filter[is_consolidation]=0` +
    `&filter[category.slug]=recurrent&filter[paid_amount]=0&filter[client_id]=${id}`;
  /** The detail read the cell issues, plus the unpaid-amount read it fires beside it. */
  const recordDetailWith =
    (id: string, requestingClientId: string) => (generator: Generator) =>
      recordDetailReads(generator, brandId, requestingClientId, id);

  async function recordStepWith(
    scenario: string,
    step: string,
    token: IToken,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, scenarioFeature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        scenarioFeature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "invoices"
    });
    generator.setBearerToken(token.access_token);
    await requests(generator);
    generator.save();
  }

  const bootFor = (id: string) => async (generator: Generator) => {
    await generator.get(listUrlFor(id));
    await generator.get(unpaidCountUrlFor(id));
    await generator.get(consolidatableCountUrlFor(id));
  };

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await lookupActorId(clientToken.access_token)) ?? "";
    brandId = await resolveBrandId(clientToken.access_token);

    memberToken = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.delegateMember.username,
      password: API_CREDENTIALS.delegateMember.password
    });
    if (memberToken)
      ownerId = await lookupDelegatedClientId(
        memberToken.access_token,
        clientId
      );

    // AC-12 — the entitled client (delegateOwner) must hold an invoice of its
    // OWN so the member's retarget read differs from its self read; arranged
    // once through the owner's real order flow and reused.
    const ownerToken = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.delegateOwner.username,
      password: API_CREDENTIALS.delegateOwner.password
    });
    if (ownerToken)
      await ensureArrangedInvoice(
        ownerToken.access_token,
        ARRANGE_PRODUCTS.recurring,
        24
      );

    // AC-13 — an invoice of the reading client's own, for the "own invoice is
    // mine to settle" contrast.
    ownInvoiceId = (
      await lookupRows(
        listUrlFor(clientId, "&limit=1"),
        clientToken.access_token
      )
    )[0]?.id;

    // AC-12/13 — the delegate member reading the client it is entitled to; the
    // first row it sees attributed as delegated.
    if (memberToken && ownerId) {
      const ownerRows = await lookupRows(
        listUrlFor(ownerId, "&limit=25"),
        memberToken.access_token
      );
      delegatedInvoiceId =
        ownerRows.find(r => r.delegate_related === true)?.id ??
        ownerRows[0]?.id;
      console.log(
        `[fixtures:generate invoices] owner(${ownerId}) rows:${ownerRows.length} ` +
          `firstDelegateRelated:${ownerRows[0]?.delegate_related}`
      );
    }

    console.log(
      "[fixtures:generate invoices] delegate recon — " +
        `clientId:${!!clientId} ownerId:${ownerId ?? "NONE"} ` +
        `delegatedInvoiceId:${delegatedInvoiceId ?? "NONE"} ` +
        `ownInvoiceId:${ownInvoiceId ?? "NONE"}`
    );
  }, 45000);

  // --- AC-1: open an invoice in the pay currency the platform holds ----------
  // The pay currency the platform holds must DIFFER from the invoice's own
  // currency, or the Then cannot tell `currencyPayment` from `currency` (audit
  // S7). Arranged by turning the brand's different-currency-payment gate ON and
  // setting the account's preferred payment currency to a brand-supported
  // currency other than its billing currency, then ordering a fresh pay-later
  // invoice that inherits the preferred currency as its `payment_currency`.
  // Restored (gate + account preference) after the step records (ADR-035 §3).

  describe("Open an invoice in the pay currency the platform holds for it", () => {
    const scenario =
      "Open an invoice in the pay currency the platform holds for it";
    const bgStep = "I am an authenticated client reading my invoices";
    const givenStep = "an invoice of mine that still owes money";
    let arranged: DifferentPaymentCurrencyArrange = {};

    beforeAll(async () => {
      arranged = await arrangeDifferentPaymentCurrency(
        clientToken.access_token
      );
    }, 90000);

    afterAll(async () => {
      await restoreDifferentPaymentCurrency(clientToken.access_token, arranged);
    }, 30000);

    it(bgStep, () =>
      recordStepWith(scenario, bgStep, clientToken, bootFor(clientId))
    );
    it(givenStep, () => {
      if (!arranged.invoiceId)
        throw new Error(
          `${scenario}: could not arrange an invoice whose pay currency ` +
            "differs from its own currency."
        );
      return recordStepWith(
        scenario,
        givenStep,
        clientToken,
        recordDetailWith(arranged.invoiceId, clientId)
      );
    });
  });

  // --- AC-12: retarget the reading at an entitled client ---------------------

  describe("Retarget my reading at an entitled client", () => {
    const scenario = "Retarget my reading at an entitled client";
    const bgStep = "I am an authenticated client reading my invoices";
    const readStep = "I read that client's invoices";
    const ownStep =
      "reading without naming a target client still gives me my own";

    it(bgStep, () =>
      recordStepWith(scenario, bgStep, clientToken, bootFor(clientId))
    );
    it(readStep, () => {
      if (!memberToken || !ownerId)
        throw new Error(`${scenario}: no delegate member token or owner id.`);
      return recordStepWith(scenario, readStep, memberToken, bootFor(ownerId!));
    });
    it(ownStep, () =>
      recordStepWith(scenario, ownStep, clientToken, generator =>
        generator.get(listUrlFor(clientId))
      )
    );
  });

  // --- AC-13: a delegated invoice is not mine to settle ----------------------

  describe("A delegated invoice is not mine to settle", () => {
    const scenario = "A delegated invoice is not mine to settle";
    const bgStep = "I am an authenticated client reading my invoices";
    const delegatedStep = "an invoice attributed to me as delegated";
    const ownStep =
      "an invoice attributed as my own or my sub-account's carries no such restriction";

    it(bgStep, () =>
      recordStepWith(scenario, bgStep, clientToken, bootFor(clientId))
    );
    it(delegatedStep, () => {
      if (!memberToken || !delegatedInvoiceId)
        throw new Error(
          `${scenario}: no delegate member token or delegated invoice.`
        );
      return recordStepWith(
        scenario,
        delegatedStep,
        memberToken,
        recordDetailWith(delegatedInvoiceId!, ownerId ?? "")
      );
    });
    it(ownStep, () => {
      if (!ownInvoiceId)
        throw new Error(`${scenario}: no own invoice in the corpus.`);
      return recordStepWith(
        scenario,
        ownStep,
        clientToken,
        recordDetailWith(ownInvoiceId!, clientId)
      );
    });
  });
});

// -----------------------------------------------------------------------------
// AC-16 PAYMENT-STATE SCENARIOS — free / paid / partly paid, each a plain detail
// scenario. `free` is arranged through the real order→convert flow (total 0);
// `partial` is an arranged unpaid invoice with a staff payment for half its
// total; `paid` is a real fully-paid row from the client's own corpus. Created
// once, reused by id.
// -----------------------------------------------------------------------------

describe("Invoices payment-state scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let brandId: string;
  let freeId: string | undefined;
  let paidId: string | undefined;
  let partialId: string | undefined;
  const prepared = new Set<string>();

  const BG = "I am an authenticated client reading my invoices";

  const listUrl = (id: string, extra = ""): string =>
    `/api/invoices?${id === clientId ? "" : `client_id=${id}&`}${LOAD_LIST_WITH}` +
    `&with_count=products&order=-create_datetime${extra}`;
  const countUrl = (id: string, extra: string): string =>
    `/api/invoices?${id === clientId ? "" : `client_id=${id}&`}order=-create_datetime&limit=1` +
    `&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted${extra}` +
    `&filter[client_id]=${id}`;

  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, scenarioFeature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        scenarioFeature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "invoices"
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  const recordBoot = async (generator: Generator): Promise<void> => {
    await generator.get(listUrl(clientId));
    await generator.get(countUrl(clientId, ""));
    await generator.get(
      countUrl(
        clientId,
        "&filter[is_consolidation]=0&filter[category.slug]=recurrent&filter[paid_amount]=0"
      )
    );
  };

  const recordDetail = (id: string) => (generator: Generator) =>
    recordDetailReads(generator, brandId, clientId, id);

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await lookupActorId(clientToken.access_token)) ?? "";
    brandId = await resolveBrandId(clientToken.access_token);

    freeId = await ensureArrangedInvoice(
      clientToken.access_token,
      ARRANGE_PRODUCTS.free,
      1
    );
    const paidRows = await lookupRows(
      listUrl(clientId, "&filter[status.code]=invoice_paid&limit=25"),
      clientToken.access_token
    );
    paidId = paidRows.find(
      r => Number((r as { total_amount?: number }).total_amount ?? 0) > 0
    )?.id;

    partialId = await arrangePartlyPaid(clientToken.access_token, clientId);
  }, 90000);

  describe("Read an invoice with no charge as free", () => {
    const scenario = "Read an invoice with no charge as free";
    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("I have opened a free invoice of mine", () => {
      if (!freeId) throw new Error(`${scenario}: no free invoice arranged.`);
      return recordStep(
        scenario,
        "I have opened a free invoice of mine",
        recordDetail(freeId)
      );
    });
  });

  describe("Read a fully paid invoice as paid", () => {
    const scenario = "Read a fully paid invoice as paid";
    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("I have opened a fully paid invoice of mine", () => {
      if (!paidId)
        throw new Error(`${scenario}: no fully paid invoice in the corpus.`);
      return recordStep(
        scenario,
        "I have opened a fully paid invoice of mine",
        recordDetail(paidId)
      );
    });
  });

  describe("Read a partly paid invoice as partially paid", () => {
    const scenario = "Read a partly paid invoice as partially paid";
    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("I have opened a partly paid invoice of mine", () => {
      if (!partialId)
        throw new Error(`${scenario}: no partly paid invoice arranged.`);
      return recordStep(
        scenario,
        "I have opened a partly paid invoice of mine",
        recordDetail(partialId)
      );
    });
  });

  // --- AC-1 guard: a partly paid invoice keeps its pay currency --------------
  // Reuses the partly-paid invoice above. The change step records the currency
  // list the step reads an alternative code from; the partial-payment guard
  // refuses the change, so the composable fires no conversion request.
  describe("I cannot change the pay currency of a partly paid invoice", () => {
    const scenario =
      "I cannot change the pay currency of a partly paid invoice";
    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("I have opened a partly paid invoice of mine", () => {
      if (!partialId)
        throw new Error(`${scenario}: no partly paid invoice arranged.`);
      return recordStep(
        scenario,
        "I have opened a partly paid invoice of mine",
        recordDetail(partialId)
      );
    });
    it("I try to change its pay currency", () =>
      recordStep(scenario, "I try to change its pay currency", generator =>
        generator.get(`/api/currencies?limit=25`)
      ));
  });
});

// -----------------------------------------------------------------------------
// FE-3145 RESUME — the scenarios the corpus does not carry but staging CAN be
// arranged to hold (staff ADMIN token via mintStaffToken; every write authorised
// by the operator brief). A failed arrange fails the step that needs its state,
// by scenario name — never a silent skip. States that MUTATE a real resource
// are restored where the platform allows (delegation grant). Routes are the
// legacy vue-app's own (store/modules/data/**), never guessed:
//   - recurring renewal: POST api/admin/invoices/contract/{c}/products/{cp}/recurring
//   - consolidate:       POST api/admin/invoices/consolidate {invoice_ids:[...]}
//   - activate:          PUT  api/admin/contracts/{c}/products/{cp}/activate
//   - manual payment:    POST api/admin/payments/manual
//   - client payment:    POST api/payments (type-10 AWAITING_CLIENT gateway)
//   - child client:      POST api/admin/clients {brand_id, parent_client_config}
//   - product delegation:PUT  api/clients/{owner}/delegates/{member}
//                          {full_delegate:false, add_contract_product_ids:[cp]}
//   - PDF download:       GET  api/invoices/{id}/download  (binary)
//   - clear method:      PATCH api/invoices/{id}/payment_details {payment_details_id:null}
// -----------------------------------------------------------------------------

/** The offline gateway a staff manual payment settles through (arrangePartlyPaid). */
const OFFLINE_GATEWAY = "4d036794-24d0-e710-275c-3153698d582e";

/** The staging brand id — child-client create needs it (client-billing-settings.fixtures.ts). */
async function resolveBrandId(accessToken: string): Promise<string> {
  const { body } = await selfCall("/api/brand/settings", accessToken);
  return String((body as { data?: { id?: string } })?.data?.id ?? "");
}

// --- different-pay-currency arrange (brand gate + account preference) ---------
// The admin brand-config read/write the gate toggle rides, mirrored verbatim
// from client-billing-settings.fixtures.ts (the module that owns this gate's
// own scenarios). `writeBrandValue` echoes the whole group back with only the
// target field changed — a group with interdependent fields 422s a single-field
// body.

const CURRENCY_GATE =
  "billing.payment_currencies.enable_different_currency_payment";

type BrandGroupField = { code?: string; value?: { value?: unknown } | null };
type BrandGroup = {
  code?: string;
  fields?: BrandGroupField[] | { data?: BrandGroupField[] };
};

async function readBrandGroupFields(
  staffAccessToken: string,
  brandId: string,
  category: string,
  group: string
): Promise<Record<string, unknown>> {
  const { status, body } = await arrangeCall(
    "GET",
    `/api/admin/config/brand/categories/${category}/groups?brand_id=${brandId}&with=fields.value`,
    staffAccessToken
  );
  if (status !== 200)
    throw new Error(`admin read of ${category}/${group} returned ${status}.`);
  const groups = (body as { data?: BrandGroup[] })?.data ?? [];
  const grp = find(groups, g => g.code === group);
  if (!grp) throw new Error(`admin group ${category}/${group} not found.`);
  const fieldList = Array.isArray(grp.fields)
    ? grp.fields
    : (grp.fields?.data ?? []);
  const fields: Record<string, unknown> = {};
  forEach(fieldList, f => {
    if (f.code)
      fields[f.code] = (f.value as { value?: unknown })?.value ?? null;
  });
  return fields;
}

async function readBrandValue(
  staffAccessToken: string,
  brandId: string,
  dottedKey: string
): Promise<unknown> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readBrandGroupFields(
    staffAccessToken,
    brandId,
    category,
    group
  );
  return fields[field] ?? null;
}

async function writeBrandValue(
  staffAccessToken: string,
  brandId: string,
  dottedKey: string,
  value: unknown
): Promise<void> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readBrandGroupFields(
    staffAccessToken,
    brandId,
    category,
    group
  );
  fields[field] = value;
  const { status, body } = await arrangeCall(
    "PUT",
    `/api/admin/config/brand/${category}?brand_id=${brandId}`,
    staffAccessToken,
    { groups: { [group]: { fields } } }
  );
  if (status !== 200)
    throw new Error(
      `admin write of ${dottedKey}=${JSON.stringify(value)} returned ${status}: ${JSON.stringify(body).slice(0, 300)}`
    );
}

type DifferentPaymentCurrencyArrange = {
  invoiceId?: string;
  gateOriginal?: unknown;
  staffAccessToken?: string;
  brandId?: string;
};

/**
 * Arranges an unpaid invoice whose `payment_currency` differs from its own
 * `currency`: turns the brand's different-currency-payment gate ON, sets the
 * brand-supported currency other than its own billing currency, then starts a
 * STAFF manual payment on a fresh pay-later invoice in that currency — a token
 * amount, so the invoice still owes money while the platform now holds a pay
 * currency that differs from the invoice's own. The gate is restored by
 * `restoreDifferentPaymentCurrency` after the recording (ADR-035 §3). A real
 * third-party / client payment is never used (operator ruling 2026-09-28); a
 * staff manual payment is the only way to set a pay currency on staging.
 */
async function arrangeDifferentPaymentCurrency(
  clientAccessToken: string
): Promise<DifferentPaymentCurrencyArrange> {
  const staffAccessToken = (await mintStaffToken()).access_token;
  const brandId = await resolveBrandId(clientAccessToken);
  const gateOriginal = await readBrandValue(
    staffAccessToken,
    brandId,
    CURRENCY_GATE
  );
  await writeBrandValue(staffAccessToken, brandId, CURRENCY_GATE, true);

  const brand = await arrangeCall(
    "GET",
    "/api/brand/settings",
    clientAccessToken
  );
  const brandData = (
    brand.body as {
      data?: {
        currency_id?: string;
        currencies?: Array<{ id?: string; code?: string }>;
      };
    }
  )?.data;
  const baseCurrencyId = brandData?.currency_id;
  const alt = find(
    brandData?.currencies ?? [],
    c => !!c.id && !!c.code && c.id !== baseCurrencyId
  );
  const altCurrencyId = alt?.id;
  const altCurrencyCode = alt?.code;
  if (!altCurrencyId || !altCurrencyCode)
    throw new Error(
      "open-in-pay-currency arrange: the brand supports no currency other than its own."
    );

  const invoiceId = await orderAndConvert(
    clientAccessToken,
    ARRANGE_PRODUCTS.recurring,
    1
  );
  if (!invoiceId)
    throw new Error(
      "open-in-pay-currency arrange: could not order an invoice."
    );

  const clientId = await lookupActorId(clientAccessToken);
  await arrangeCall("POST", "/api/admin/payments/manual", staffAccessToken, {
    invoice_id: invoiceId,
    client_id: clientId,
    amount: 1,
    gateway_id: OFFLINE_GATEWAY,
    currency_id: altCurrencyId
  });

  const read = await arrangeCall(
    "GET",
    `/api/invoices/${invoiceId}`,
    clientAccessToken
  );
  const data = (
    read.body as {
      data?: {
        unpaid_amount?: number;
        currency?: { code?: string };
        payment_currency?: { code?: string } | null;
      };
    }
  )?.data;
  console.log(
    `[fixtures:generate invoices] open-in-pay-currency arrange: invoice ${invoiceId} ` +
      `currency=${data?.currency?.code ?? "NONE"} payment_currency=${data?.payment_currency?.code ?? "NONE"} ` +
      `unpaid=${data?.unpaid_amount ?? "NONE"}`
  );
  if (!(Number(data?.unpaid_amount ?? 0) > 0))
    throw new Error(
      "open-in-pay-currency arrange: the invoice no longer owes money after the token payment."
    );

  return { invoiceId, gateOriginal, staffAccessToken, brandId };
}

/** Restores the brand gate the arrange turned on. */
async function restoreDifferentPaymentCurrency(
  _clientAccessToken: string,
  arrange: DifferentPaymentCurrencyArrange
): Promise<void> {
  if (arrange.staffAccessToken && arrange.brandId)
    await writeBrandValue(
      arrange.staffAccessToken,
      arrange.brandId,
      CURRENCY_GATE,
      arrange.gateOriginal
    );
}

/** The two ids a renewal needs, off a freshly ordered+converted invoice's first product. */
/** Orders one product and converts it pay-later; returns the new invoice id. */
async function orderAndConvert(
  accessToken: string,
  productId: string,
  billingCycleMonths: number
): Promise<string | undefined> {
  const order = await arrangeCall("POST", "/api/orders", accessToken, {
    category_slug: "new_contract",
    products: [
      {
        product_id: productId,
        quantity: 1,
        billing_cycle_months: billingCycleMonths
      }
    ]
  });
  const basketId = (order.body as { data?: { id?: string } })?.data?.id;
  if (!basketId) return undefined;
  const convert = await arrangeCall(
    "PATCH",
    `/api/orders/${basketId}/convert`,
    accessToken,
    { type: PaymentType.PAY_LATER, amount: 0 }
  );
  return (convert.body as { data?: { id?: string } })?.data?.id;
}

async function orderRecurringContract(accessToken: string): Promise<{
  invoiceId?: string;
  contractId?: string;
  contractProductId?: string;
  currencyId?: string;
}> {
  const order = await arrangeCall("POST", "/api/orders", accessToken, {
    category_slug: "new_contract",
    products: [
      {
        product_id: ARRANGE_PRODUCTS.recurring,
        quantity: 1,
        billing_cycle_months: 1
      }
    ]
  });
  const basketId = (order.body as { data?: { id?: string } })?.data?.id;
  if (!basketId) {
    console.log(
      `[fixtures:generate invoices] orderRecurringContract order ${order.status} body:${JSON.stringify(order.body).slice(0, 300)}`
    );
    return {};
  }
  const convert = await arrangeCall(
    "PATCH",
    `/api/orders/${basketId}/convert`,
    accessToken,
    { type: PaymentType.PAY_LATER, amount: 0 }
  );
  const invoiceId = (convert.body as { data?: { id?: string } })?.data?.id;
  if (!invoiceId) {
    console.log(
      `[fixtures:generate invoices] orderRecurringContract convert ${convert.status} body:${JSON.stringify(convert.body).slice(0, 300)}`
    );
    return {};
  }
  const read = await arrangeCall(
    "GET",
    `/api/invoices/${invoiceId}?with=products`,
    accessToken
  );
  const data = (
    read.body as {
      data?: {
        currency_id?: string;
        total_amount?: number;
        products?: Array<{
          contract_id?: string;
          contracts_product_id?: string;
        }>;
      };
    }
  )?.data;
  const product = (data?.products ?? [])[0];
  return {
    invoiceId,
    contractId: product?.contract_id,
    contractProductId: product?.contracts_product_id,
    currencyId: data?.currency_id
  };
}

/**
 * A fresh invoice, fully settled by a STAFF manual payment (never a real
 * third-party gateway, never a client-initiated one — confirmed live,
 * 2026-09-28: every non-type-10 gateway this brand offers 422s a client
 * `POST /api/payments` with "This gateway does not support automatic
 * payments", and every type-1 gateway answers 200 with a real third-party
 * `transaction_status: "REDIRECT"` approval url, banned outright — so a
 * CLIENT-initiated payment cannot land in ANY state on this brand without
 * either violating the gateway ban or 422ing). A staff settlement still
 * produces a real new payment row the client's list genuinely reflects.
 */
async function arrangeSettledInvoice(
  clientAccessToken: string
): Promise<string | undefined> {
  const forSettle = await orderRecurringContract(clientAccessToken);
  if (!forSettle.invoiceId || !forSettle.currencyId) return undefined;
  const staffToken = await mintStaffToken();
  const clientId = await lookupActorId(clientAccessToken);
  const invRead = await arrangeCall(
    "GET",
    `/api/invoices/${forSettle.invoiceId}`,
    clientAccessToken
  );
  const totalAmount =
    (invRead.body as { data?: { total_amount?: number } })?.data
      ?.total_amount ?? 1;
  if (!clientId) return undefined;
  await payInvoiceInFull(
    staffToken.access_token,
    clientId,
    forSettle.invoiceId,
    totalAmount,
    forSettle.currencyId
  );
  const reread = await arrangeCall(
    "GET",
    `/api/invoices/${forSettle.invoiceId}?${LOAD_ONE_WITH}&with_count=products`,
    clientAccessToken
  );
  const pays =
    (reread.body as { data?: { payments?: Array<{ id?: string }> } })?.data
      ?.payments ?? [];
  console.log(
    `[fixtures:generate invoices] arrangeSettledInvoice ${forSettle.invoiceId} payments:${pays.length}`
  );
  return pays.length > 0 ? forSettle.invoiceId : undefined;
}

/** Full staff manual payment — settles the invoice so its contract activates. */
async function payInvoiceInFull(
  staffToken: string,
  clientId: string,
  invoiceId: string,
  totalAmount: number,
  currencyId: string
): Promise<void> {
  await arrangeCall("POST", "/api/admin/payments/manual", staffToken, {
    invoice_id: invoiceId,
    client_id: clientId,
    amount: Math.max(1, Number(totalAmount || 1)),
    gateway_id: OFFLINE_GATEWAY,
    currency_id: currencyId
  });
}

/**
 * A pair of unpaid RECURRING invoices for the same client — the input consolidate
 * needs. Order+convert a recurring product, settle it (so the contract activates),
 * then generate a recurring renewal (unpaid). Twice, on two contracts.
 */
async function arrangeUnpaidRecurringPair(
  clientToken: string,
  staffToken: string,
  clientId: string
): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < 2; i++) {
    const { invoiceId, contractId, contractProductId, currencyId } =
      await orderRecurringContract(clientToken);
    if (!invoiceId || !contractId || !contractProductId || !currencyId) {
      console.log(
        `[fixtures:generate invoices] recurring order #${i} incomplete — AC-7/11 arrange skipped.`
      );
      continue;
    }
    const read = await arrangeCall(
      "GET",
      `/api/invoices/${invoiceId}`,
      clientToken
    );
    const total = Number(
      (read.body as { data?: { total_amount?: number } })?.data?.total_amount ??
        0
    );
    await payInvoiceInFull(staffToken, clientId, invoiceId, total, currencyId);
    const activate = await arrangeCall(
      "PUT",
      `/api/admin/contracts/${contractId}/products/${contractProductId}/activate`,
      staffToken
    );
    const renew = await arrangeCall(
      "POST",
      `/api/admin/invoices/contract/${contractId}/products/${contractProductId}/recurring`,
      staffToken,
      {}
    );
    const renewalId = (renew.body as { data?: { id?: string } })?.data?.id;
    console.log(
      `[fixtures:generate invoices] recurring #${i}: activate ${activate.status}, renew ${renew.status}, renewalId ${renewalId ?? "NONE"}`
    );
    if (renewalId) ids.push(renewalId);
  }
  return ids;
}

describe("Invoices FE-3145-resume scenario recordings", () => {
  let clientToken: IToken;
  let staffToken: IToken | undefined;
  let clientId: string;
  let brandId: string;
  const prepared = new Set<string>();

  // Resolved live in beforeAll; `undefined` fails the step that needs it.
  const ids: {
    consolidationCreditNote?: string;
    anyInvoice?: string;
    coMingledClientId?: string;
    assignedMethod?: string;
    paymentDetailsId?: string;
    contractProduct?: string;
    delegateOwnerId?: string;
    delegateOwnerContractProduct?: string;
  } = {};
  let memberToken: IToken | undefined;
  let delegateRecordId: string | undefined;

  const listUrl = (id: string, extra = ""): string =>
    `/api/invoices?${id === clientId ? "" : `client_id=${id}&`}${LOAD_LIST_WITH}` +
    `&with_count=products&order=-create_datetime${extra}`;
  const countUrl = (id: string, extra = ""): string =>
    `/api/invoices?${id === clientId ? "" : `client_id=${id}&`}order=-create_datetime&limit=1` +
    `&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted${extra}` +
    `&filter[client_id]=${id}`;
  const detailUrl = (id: string): string =>
    `/api/invoices/${id}?${LOAD_ONE_WITH}&with_count=products`;

  // Narrowing to a contracts_product re-fires the two gated count reads. They
  // mirror the narrowed list read: the product context replaces any client
  // context, so the probes carry `products.contracts_product_id` and NO
  // `filter[client_id]` — exactly as `listUrl` drops it on a narrow. `cp` is
  // the contract product narrowed to.
  const narrowedCountUrl = (cp: string, extra = ""): string =>
    `/api/invoices?order=-create_datetime&limit=1` +
    `&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted${extra}` +
    `&filter[products.contracts_product_id]=${cp}`;

  const recordNarrowedCounts =
    (cp: string) =>
    async (generator: Generator): Promise<void> => {
      await generator.get(narrowedCountUrl(cp));
      await generator.get(
        narrowedCountUrl(
          cp,
          "&filter[is_consolidation]=0&filter[category.slug]=recurrent" +
            "&filter[paid_amount]=0"
        )
      );
    };

  async function record(
    scenario: string,
    step: string,
    token: IToken,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, scenarioFeature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        scenarioFeature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "invoices"
    });
    generator.setBearerToken(token.access_token);
    await requests(generator);
    generator.save();
  }

  const boot =
    (id: string) =>
    async (generator: Generator): Promise<void> => {
      await generator.get(listUrl(id));
      await generator.get(countUrl(id));
      await generator.get(
        countUrl(
          id,
          "&filter[is_consolidation]=0&filter[category.slug]=recurrent&filter[paid_amount]=0"
        )
      );
    };

  const detail =
    (id: string) =>
    async (generator: Generator): Promise<void> => {
      await recordDetailReads(generator, brandId, clientId, id);
    };

  const BG = "I am an authenticated client reading my invoices";

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await lookupActorId(clientToken.access_token)) ?? "";
    staffToken = await mintStaffToken().catch(e => {
      console.log(
        "[fixtures:generate invoices] staff mint FAILED:",
        (e as Error).message
      );
      return undefined;
    });
    brandId = await resolveBrandId(clientToken.access_token);
    console.log(
      `[fixtures:generate invoices] resume recon — clientId:${!!clientId} staff:${!!staffToken} brandId:${brandId || "NONE"}`
    );

    // AC-4 — CREATED every run: the first clearable (unpaid/overdue/adjusted —
    // staging 409s the PATCH on a paid invoice) invoice is reset to no method,
    // then "Assign" records setting the client's own stored method and "Clear"
    // records clearing it again, which leaves it as it was found.
    const assignedRow = await lookupRows(
      listUrl(
        clientId,
        "&filter[status.code]=invoice_unpaid,invoice_overdue,invoice_adjusted&limit=1"
      ),
      clientToken.access_token
    );
    const methods = await arrangeCall(
      "GET",
      `/api/clients/${clientId}/payment_details?limit=1&active=true`,
      clientToken.access_token
    );
    ids.paymentDetailsId = (
      methods.body as { data?: Array<{ id?: string }> }
    )?.data?.[0]?.id;
    if (assignedRow[0]?.id && ids.paymentDetailsId) {
      const reset = await arrangeCall(
        "PATCH",
        `/api/invoices/${assignedRow[0].id}/payment_details`,
        clientToken.access_token,
        { payment_details_id: null }
      );
      if (reset.status < 400) ids.assignedMethod = assignedRow[0].id;
    }

    // AC-18 c×self — a contract product of the client's to narrow by.
    const cps = await lookupRows(
      `/api/contracts_products?client_id=${clientId}&limit=5`,
      clientToken.access_token
    );
    ids.contractProduct = cps[0]?.id;

    // A generic anchor invoice for the PDF-download scenarios below — any of
    // the client's unpaid rows, no pending-payment/gateway state required.
    // AC-8's own third-party-gateway scenarios were DELETED (operator ruling
    // 2026-09-28 — never exercise a real payment gateway in an integration
    // test); this replaces the pending-payment corpus scan that used to
    // supply their fallback anchor.
    // The PDF-download anchor must be a genuinely downloadable invoice: a
    // freshly arranged pay-later/unpaid invoice has no rendered PDF and 404s
    // the download. Probe the corpus and take the first whose /download is 200.
    const downloadCandidates = await lookupRows(
      listUrl(clientId, "&limit=25"),
      clientToken.access_token
    );
    for (const row of downloadCandidates) {
      if (!row.id) continue;
      const probe = await arrangeCall(
        "GET",
        `/api/invoices/${row.id}/download`,
        clientToken.access_token
      );
      if (probe.status === 200) {
        ids.anyInvoice = row.id;
        break;
      }
    }

    if (!staffToken)
      throw new Error(
        "Invoices FE-3145-resume scenario recordings: no staff token to arrange with."
      );

    // AC-7 — consolidate two unpaid recurring invoices; the consolidation
    // yields a credit note that is is_consolidation (the AC-7 label this
    // module reads). "See my outstanding balance distinct from the raw
    // unpaid amount" (the former AC-11) was DELETED — operator ruling:
    // balance vs. unpaid_amount divergence is backend arithmetic, not this
    // module's responsibility to prove — so this arrange no longer scans for
    // a divergent row.
    const pair = await arrangeUnpaidRecurringPair(
      clientToken.access_token,
      staffToken.access_token,
      clientId
    );
    if (pair.length >= 2) {
      const cons = await arrangeCall(
        "POST",
        "/api/admin/invoices/consolidate",
        staffToken.access_token,
        {
          invoice_ids: pair
        }
      );
      const consolidationId = (cons.body as { data?: { id?: string } })?.data
        ?.id;
      console.log(
        `[fixtures:generate invoices] consolidate ${cons.status} consolidationId:${consolidationId ?? "NONE"}`
      );
      const cn = await lookupRows(
        listUrl(
          clientId,
          "&filter[category.slug]=credit_note,credit_note_for_refund&filter[is_consolidation]=1&limit=5"
        ),
        clientToken.access_token
      );
      ids.consolidationCreditNote = cn[0]?.id;
      console.log(
        `[fixtures:generate invoices] AC-7 creditNote:${ids.consolidationCreditNote ?? "NONE"}`
      );
    }

    // AC-13 — a sub-account (child) client of the reading client, holding its own
    // invoice, so a co-mingled parent read carries an own row and a child row.
    // Two-step (vue-app): create the client, then link it under the parent via
    // POST api/admin/clients/{parentId}/child_configs.
    const child = await arrangeCall(
      "POST",
      "/api/admin/clients",
      staffToken.access_token,
      {
        firstname: "FE3145",
        lastname: "Child",
        email: `fe3145.child.${Date.now()}@example.com`,
        brand_id: brandId
      }
    );
    ids.coMingledClientId = (
      child.body as { data?: { id?: string } }
    )?.data?.id;
    if (ids.coMingledClientId) {
      const link = await arrangeCall(
        "POST",
        `/api/admin/clients/${clientId}/child_configs`,
        staffToken.access_token,
        {
          child_client_id: ids.coMingledClientId,
          allow_impersonation: true,
          inherit_payment_details: true
        }
      );
      // The child needs an invoice of its own — arrange one via the admin order
      // flow on the child (best-effort; disclosed if it cannot).
      const childOrder = await arrangeCall(
        "POST",
        "/api/admin/orders",
        staffToken.access_token,
        {
          client_id: ids.coMingledClientId,
          category_slug: "new_contract",
          products: [
            {
              product_id: ARRANGE_PRODUCTS.free,
              quantity: 1,
              billing_cycle_months: 1
            }
          ]
        }
      );
      console.log(
        `[fixtures:generate invoices] AC-13 child:${ids.coMingledClientId} link:${link.status} childOrder:${childOrder.status}`
      );
    }

    // AC-18 c×c — grant the delegate MEMBER a per-product delegation on an owner's
    // contract product, so a retargeted read can be narrowed to that product.
    await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.delegateMember.username,
      password: API_CREDENTIALS.delegateMember.password
    })
      .then(mt => {
        memberToken = mt;
        return mintToken({
          grant_type: GrantTypes.PASSWORD,
          username: API_CREDENTIALS.delegateOwner.username,
          password: API_CREDENTIALS.delegateOwner.password
        });
      })
      .then(ownerToken => {
        if (!memberToken || !ownerToken) return undefined;
        const member = memberToken;
        const owner = ownerToken;
        return lookupActorId(owner.access_token)
          .then(ownerActorId => {
            ids.delegateOwnerId = ownerActorId;
            return lookupActorId(member.access_token);
          })
          .then(memberId =>
            lookupRows(
              `/api/contracts_products?client_id=${ids.delegateOwnerId}&limit=5`,
              owner.access_token
            ).then(ownerCps => {
              ids.delegateOwnerContractProduct = ownerCps[0]?.id;
              // The delegate RECORD id, not the member's client id — legacy
              // `delegates.ts` updateDelegate PUTs `api/clients/{owner}/delegates/{delegateId}`.
              return lookupRows(
                `/api/clients/${ids.delegateOwnerId}/delegates`,
                owner.access_token
              ).then(delegatesRaw => {
                const delegates = delegatesRaw as {
                  id?: string;
                  client_id?: string | null;
                }[];
                delegateRecordId = find(delegates, {
                  client_id: memberId
                })?.id;
                if (
                  ids.delegateOwnerId &&
                  delegateRecordId &&
                  ids.delegateOwnerContractProduct
                ) {
                  return arrangeCall(
                    "PUT",
                    `/api/clients/${ids.delegateOwnerId}/delegates/${delegateRecordId}`,
                    owner.access_token,
                    {
                      full_delegate: false,
                      add_contract_product_ids: [
                        ids.delegateOwnerContractProduct
                      ]
                    }
                  ).then(grant => {
                    console.log(
                      `[fixtures:generate invoices] AC-18 c×c grant ${grant.status} owner:${ids.delegateOwnerId} cp:${ids.delegateOwnerContractProduct}`
                    );
                  });
                }
                return undefined;
              });
            })
          );
      })
      .catch(e => {
        console.log(
          "[fixtures:generate invoices] AC-18 c×c delegation arrange failed:",
          (e as Error).message
        );
      });
  }, 240000);

  afterAll(async () => {
    // Restore the per-product delegation grant to full (leave staging as found).
    if (memberToken && ids.delegateOwnerId) {
      await mintToken({
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.delegateOwner.username,
        password: API_CREDENTIALS.delegateOwner.password
      })
        .then(ownerToken => {
          if (ownerToken && delegateRecordId)
            return arrangeCall(
              "PUT",
              `/api/clients/${ids.delegateOwnerId}/delegates/${delegateRecordId}`,
              ownerToken.access_token,
              { full_delegate: true }
            );
          return undefined;
        })
        .catch(() => {
          /* disclosure only — restore is best-effort */
        });
    }
  }, 60000);

  // --- AC-7 (label a consolidation credit note as a consolidation) -----------
  describe("Label a consolidation credit note as a consolidation, not a refund", () => {
    const scenario =
      "Label a consolidation credit note as a consolidation, not a refund";
    it(BG, () => record(scenario, BG, clientToken, boot(clientId)));
    it("a credit note that was also created by a consolidation", () => {
      if (!ids.consolidationCreditNote)
        throw new Error(`${scenario}: no consolidation credit note arranged.`);
      return record(
        scenario,
        "a credit note that was also created by a consolidation",
        clientToken,
        detail(ids.consolidationCreditNote)
      );
    });
  });

  // --- AC-13 (co-mingled attribution: own + sub-account) ---------------------
  // AC-13 — a sub-account CREATED once (found again by its fixed email), linked
  // to this client as its child, with an invoice of its own; the client's own
  // list then co-mingles both (legacy invoicesProvider.vue sends no client_id).
  describe("Attribute each invoice in a co-mingled list", () => {
    const scenario = "Attribute each invoice in a co-mingled list";

    beforeAll(async () => {
      const staff = (await mintStaffToken()).access_token;
      const email = `fe3145-subaccount-${clientId.slice(0, 8)}@example.com`;
      const found = await arrangeCall(
        "GET",
        `/api/admin/clients?filter[email]=${encodeURIComponent(email)}&limit=1`,
        staff
      );
      let childId = (found.body as { data?: Array<{ id: string }> })?.data?.[0]
        ?.id;
      if (!childId) {
        const currencies = await arrangeCall(
          "GET",
          "/api/currencies?limit=1",
          clientToken.access_token
        );
        const created = await arrangeCall("POST", "/api/admin/clients", staff, {
          brand_id: brandId,
          firstname: "FE3145",
          lastname: "SubAccount",
          email,
          username: email,
          password: "Password1",
          language: "en",
          currency_id: (currencies.body as { data?: Array<{ id: string }> })
            ?.data?.[0]?.id
        });
        childId = (created.body as { data?: { id?: string } })?.data?.id;
        if (!childId)
          throw new Error(
            `AC-13 arrange: child create ${created.status} ${JSON.stringify(created.body).slice(0, 300)}`
          );
      }
      await arrangeCall(
        "POST",
        `/api/admin/clients/${clientId}/child_configs`,
        staff,
        {
          child_client_id: childId,
          allow_impersonation: true,
          inherit_payment_details: true
        }
      );
      const childInvoices = await arrangeCall(
        "GET",
        `/api/admin/invoices?filter[client_id]=${childId}&limit=1`,
        staff
      );
      if (!(childInvoices.body as { data?: unknown[] })?.data?.length) {
        const child = await arrangeCall(
          "GET",
          `/api/admin/clients/${childId}?with=accounts`,
          staff
        );
        const accountId = (
          child.body as { data?: { accounts?: Array<{ id: string }> } }
        )?.data?.accounts?.[0]?.id;
        const order = await arrangeCall("POST", "/api/admin/orders", staff, {
          client_id: childId,
          account_id: accountId,
          brand_id: brandId,
          category_slug: "new_contract",
          products: [
            {
              product_id: ARRANGE_PRODUCTS.recurring,
              quantity: 1,
              billing_cycle_months: 1
            }
          ]
        });
        const basketId = (order.body as { data?: { id?: string } })?.data?.id;
        const convert = basketId
          ? await arrangeCall(
              "PATCH",
              `/api/admin/orders/${basketId}/convert`,
              staff,
              {
                type: PaymentType.PAY_LATER,
                amount: 0
              }
            )
          : order;
        if (!(convert.body as { data?: { id?: string } })?.data?.id)
          throw new Error(
            `AC-13 arrange: child invoice ${convert.status} ${JSON.stringify(convert.body).slice(0, 300)}`
          );
      }
    }, 120000);

    it(BG, () => record(scenario, BG, clientToken, boot(clientId)));
    it("a list mixing my own invoices and a sub-account's", () =>
      record(
        scenario,
        "a list mixing my own invoices and a sub-account's",
        clientToken,
        boot(clientId)
      ));
    it("I read that list", () =>
      record(scenario, "I read that list", clientToken, () =>
        Promise.resolve()
      ));
    it("my own invoices are attributed to me, and my sub-account's to the sub-account", () =>
      record(
        scenario,
        "my own invoices are attributed to me, and my sub-account's to the sub-account",
        clientToken,
        () => Promise.resolve()
      ));
  });

  // --- AC-17 (download an invoice's PDF document) — binary GET ----------------
  // Appended-section scenario: no Background, its own boot Given (augmentation law).
  describe("Download an invoice's PDF document", () => {
    const scenario = "Download an invoice's PDF document";
    it("I have opened one of my invoices", async () => {
      const anchor = ids.anyInvoice;
      if (!anchor)
        throw new Error(`${scenario}: no downloadable anchor invoice.`);
      await record(
        scenario,
        "I have opened one of my invoices",
        clientToken,
        detail(anchor)
      );
      await record(
        scenario,
        "I download its PDF document",
        clientToken,
        generator =>
          generator.get(
            `/api/invoices/${anchor}/download`,
            undefined,
            undefined,
            "binary"
          )
      );
    });
  });

  // --- AC-17 (download a credit note's PDF the same way) ---------------------
  describe("Download a credit note's PDF document the same way", () => {
    const scenario = "Download a credit note's PDF document the same way";
    it("I have opened one of my credit notes", async () => {
      const cn = ids.consolidationCreditNote;
      if (!cn) throw new Error(`${scenario}: no credit note arranged.`);
      await record(
        scenario,
        "I have opened one of my credit notes",
        clientToken,
        detail(cn)
      );
      await record(
        scenario,
        "I download its PDF document",
        clientToken,
        generator =>
          generator.get(
            `/api/invoices/${cn}/download`,
            undefined,
            undefined,
            "binary"
          )
      );
    });
  });

  // --- AC-9 (next charge date, shown / absent) — both invoices CREATED here ---
  // A recurring product's invoice carries a next charge date.
  for (const [condition, outcome, productId, months] of [
    ["is on a recurring product", "shown", ARRANGE_PRODUCTS.recurring, 1]
  ] as const) {
    describe(`Read the next charge date of an invoice that ${condition}`, () => {
      const scenario = `Read the next charge date of an invoice that ${condition}`;
      let invoiceId: string | undefined;
      beforeAll(async () => {
        invoiceId = await orderAndConvert(
          clientToken.access_token,
          productId,
          months
        );
        if (!invoiceId)
          throw new Error(`AC-9 arrange: no invoice for "${condition}".`);
      }, 60000);
      it(BG, () => record(scenario, BG, clientToken, boot(clientId)));
      it(`an invoice that "${condition}"`, () =>
        record(
          scenario,
          `an invoice that "${condition}"`,
          clientToken,
          detail(invoiceId!)
        ));
      it("I read that invoice's next charge date", () =>
        record(
          scenario,
          "I read that invoice's next charge date",
          clientToken,
          () => Promise.resolve()
        ));
      it(`the next charge date is "${outcome}"`, () =>
        record(
          scenario,
          `the next charge date is "${outcome}"`,
          clientToken,
          () => Promise.resolve()
        ));
    });
  }

  // --- AC-4 (assign a payment method) — re-read after a write ----------------
  describe("Assign a payment method to an invoice", () => {
    const scenario = "Assign a payment method to an invoice";
    it(BG, () => record(scenario, BG, clientToken, boot(clientId)));
    it("one of my invoices has no payment method assigned", () => {
      if (!ids.assignedMethod)
        throw new Error(
          `${scenario}: no clearable invoice reset to no method.`
        );
      return record(
        scenario,
        "one of my invoices has no payment method assigned",
        clientToken,
        detail(ids.assignedMethod)
      );
    });
    it("I assign a payment method to it", async () => {
      if (!ids.assignedMethod || !ids.paymentDetailsId)
        throw new Error(
          `${scenario}: no clearable invoice or no stored payment method.`
        );
      await record(
        scenario,
        "I assign a payment method to it",
        clientToken,
        async generator => {
          await generator.patch(
            `/api/invoices/${ids.assignedMethod}/payment_details`,
            { payment_details_id: ids.paymentDetailsId }
          );
          await generator.get(detailUrl(ids.assignedMethod!));
        }
      );
    });
  });

  // --- AC-4 (clear the assigned payment method) — re-read after a write -------
  describe('Clear the assigned payment method back to "none selected"', () => {
    const scenario =
      'Clear the assigned payment method back to "none selected"';
    it(BG, () => record(scenario, BG, clientToken, boot(clientId)));
    it("one of my invoices has a payment method assigned", () => {
      if (!ids.assignedMethod)
        throw new Error(`${scenario}: no invoice with an assigned method.`);
      return record(
        scenario,
        "one of my invoices has a payment method assigned",
        clientToken,
        detail(ids.assignedMethod)
      );
    });
    it("I clear the assigned payment method", async () => {
      if (!ids.assignedMethod)
        throw new Error(`${scenario}: no invoice with an assigned method.`);
      // Records the PATCH the clear issues, then the re-read that now shows none.
      await record(
        scenario,
        "I clear the assigned payment method",
        clientToken,
        async generator => {
          await generator.patch(
            `/api/invoices/${ids.assignedMethod}/payment_details`,
            { payment_details_id: null }
          );
          await generator.get(detailUrl(ids.assignedMethod!));
        }
      );
    });
  });

  // --- AC-18 c×self (narrow my list to one contract product) -----------------
  // Appended-section scenario: no Background, its own boot Given.
  describe("Narrow my invoice list to one contract product's invoices", () => {
    const scenario =
      "Narrow my invoice list to one contract product's invoices";
    it("I have opened my invoice list", () =>
      record(
        scenario,
        "I have opened my invoice list",
        clientToken,
        boot(clientId)
      ));
    it("I narrow it to one contract product's invoices", () => {
      if (!ids.contractProduct)
        throw new Error(`${scenario}: no contract product of the client's.`);
      return record(
        scenario,
        "I narrow it to one contract product's invoices",
        clientToken,
        async generator => {
          await generator.get(
            listUrl(
              clientId,
              `&filter[products.contracts_product_id]=${ids.contractProduct}`
            )
          );
          await recordNarrowedCounts(ids.contractProduct!)(generator);
        }
      );
    });
  });

  // --- AC-18 c×c (narrowing survives a retargeted reading) --------------------
  // Appended-section scenario: no Background, its own boot Given (member reads owner).
  describe("Narrowing to a product does not re-widen a retargeted reading", () => {
    const scenario =
      "Narrowing to a product does not re-widen a retargeted reading";
    it("I have been entrusted with another client's invoices", () => {
      if (!memberToken || !ids.delegateOwnerId)
        throw new Error(`${scenario}: no delegate member token or owner id.`);
      return record(
        scenario,
        "I have been entrusted with another client's invoices",
        memberToken,
        boot(ids.delegateOwnerId)
      );
    });
    it("I narrow that client's invoices to one contract product's invoices", () => {
      if (
        !memberToken ||
        !ids.delegateOwnerId ||
        !ids.delegateOwnerContractProduct
      )
        throw new Error(`${scenario}: no per-product delegation granted.`);
      return record(
        scenario,
        "I narrow that client's invoices to one contract product's invoices",
        memberToken,
        async generator => {
          await generator.get(
            `/api/invoices?${LOAD_LIST_WITH}&with_count=products&order=-create_datetime&filter[products.contracts_product_id]=${ids.delegateOwnerContractProduct}`
          );
          // The replay drives this cell from the one shared primary session;
          // the narrowed probes carry no client_id, so record them as that
          // session.
          generator.setBearerToken(clientToken.access_token);
          await recordNarrowedCounts(ids.delegateOwnerContractProduct!)(
            generator
          );
        }
      );
    });
  });
});

// -----------------------------------------------------------------------------
// THE ORDER HISTORY (FE-3237) — the `new_contract` selector context of the
// client cell. Each request is the one the design names (design 8.1, 8.3): the
// list read carries the static `filter[category.slug]=new_contract`, the list
// relations with `tags`, and no client id. The probes keep the client-level
// criteria (D-5). A state staging does not hold is arranged with the staff
// account and reset after the recording.
// -----------------------------------------------------------------------------

const ORDER_LIST_WITH = `${LOAD_LIST_WITH},tags`;

describe("Invoices order-history scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let brandId: string;
  const prepared = new Set<string>();

  const UNPAID_STATUS = "invoice_unpaid,invoice_overdue,invoice_adjusted";

  const defaultListUrl = (): string =>
    `/api/invoices?${ORDER_LIST_WITH}&with_count=products` +
    "&order=-create_datetime&limit=10&offset=0";

  /** The order-history list read: the static category, then the given criteria. */
  const orderListUrl = (
    extra = "",
    { limit = 10, offset = 0, order = "-create_datetime" } = {}
  ): string =>
    `/api/invoices?${ORDER_LIST_WITH}&with_count=products` +
    `&filter[category.slug]=${InvoiceCategoryCode.NEW_CONTRACT}` +
    `&order=${order}&limit=${limit}&offset=${offset}${extra}`;

  const unpaidCountUrl = (): string =>
    `/api/invoices?order=-create_datetime&limit=1` +
    `&filter[status.code]=${UNPAID_STATUS}&filter[client_id]=${clientId}`;

  const consolidatableCountUrl = (): string =>
    `/api/invoices?order=-create_datetime&limit=1` +
    `&filter[status.code]=${UNPAID_STATUS}&filter[is_consolidation]=0` +
    `&filter[category.slug]=recurrent&filter[paid_amount]=0` +
    `&filter[client_id]=${clientId}`;

  const recordProbes = async (generator: Generator): Promise<void> => {
    await generator.get(unpaidCountUrl());
    await generator.get(consolidatableCountUrl());
  };

  /** The default collection boot the Background reads. */
  const recordBoot = async (generator: Generator): Promise<void> => {
    await generator.get(defaultListUrl());
    await recordProbes(generator);
  };

  /** The order-history boot: its list read and its client-level probes. */
  const recordOrderBoot =
    (extra = "") =>
    async (generator: Generator): Promise<void> => {
      await generator.get(orderListUrl(extra));
      await recordProbes(generator);
    };

  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, scenarioFeature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        scenarioFeature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "invoices"
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  /** An order number no order of the client holds. */
  const NO_SUCH_ORDER = "FE3237-NO-SUCH-ORDER";

  /** The Unpaid status choice: one csv value, two statuses (design 8.3). */
  const UNPAID_CHOICE =
    "&filter[status.code|eq]=invoice_unpaid,invoice_adjusted";

  type CorpusOrder = {
    id: string;
    number: string;
    total_amount: number;
    create_datetime: string;
    paid_datetime?: string | null;
    status?: { code?: string };
    products?: Array<{
      service_identifier?: string | null;
      product?: { name?: string; category?: { name?: string } };
    }>;
  };

  /** The values each narrowing scenario writes, chosen from the live corpus. */
  const corpus = {
    threePagesFrom: "",
    paidFrom: "",
    unpaidCategory: "",
    unpaidNumber: "",
    numberA: "",
    numberB: "",
    narrowTarget: {
      name: "",
      otherName: "",
      category: "",
      service: "",
      number: "",
      total: 0
    }
  };

  async function readOrders(query: string): Promise<CorpusOrder[]> {
    const { body } = await selfCall(
      `/api/invoices?filter[category.slug]=${InvoiceCategoryCode.NEW_CONTRACT}` +
        `&with=status,products.product.category&order=-create_datetime&${query}`,
      clientToken.access_token
    );
    return (body as { data?: CorpusOrder[] })?.data ?? [];
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = await resolveClientId(clientToken.access_token);
    brandId = await resolveBrandId(clientToken.access_token);
    if (!clientId)
      throw new Error(
        "Could not resolve the client id from /self — cannot record the " +
          "order-history scenarios."
      );

    const newest = await readOrders("limit=30");
    if (newest.length < 30)
      throw new Error(
        "The client holds fewer than 30 placed orders — the order-history " +
          "scenarios need three pages. Escalate."
      );
    corpus.numberA = newest[0].number;
    corpus.numberB = newest[1].number;
    corpus.threePagesFrom = newest[24].create_datetime;
    const paid = find(newest, row => !!row.paid_datetime);
    if (!paid?.paid_datetime)
      throw new Error("No paid order among the newest thirty. Escalate.");
    corpus.paidFrom = `${paid.paid_datetime.slice(0, 10)} 00:00:00`;

    // Three unpaid orders of one category give page two at two a page; the
    // recording runs settle unpaid orders, so place more when too few are left.
    const unpaidOrders = (): Promise<CorpusOrder[]> =>
      readOrders(
        "limit=50&filter[status.code|eq]=invoice_unpaid,invoice_adjusted"
      );
    let unpaid = await unpaidOrders();
    for (let placed = size(unpaid); placed < 3; placed++)
      await orderAndConvert(
        clientToken.access_token,
        ARRANGE_PRODUCTS.recurring,
        1
      );
    unpaid = await unpaidOrders();
    const category = unpaid[0]?.products?.[0]?.product?.category?.name;
    const sameCategory = filter(
      unpaid,
      row => row.products?.[0]?.product?.category?.name === category
    );
    if (!category || sameCategory.length < 3)
      throw new Error(
        "Fewer than three unpaid orders share a product category — the " +
          '"Find one order by its number" scenario needs page two at two a page. Escalate.'
      );
    corpus.unpaidCategory = trim(category);
    corpus.unpaidNumber = sameCategory[sameCategory.length - 1].number;

    const serviced = await readOrders(
      "limit=50&filter[products.service_identifier|like]=%25.%25"
    );
    const target = find(serviced, row => {
      const item = row.products?.[0];
      return !!(
        item?.service_identifier &&
        item.product?.name &&
        item.product.category?.name
      );
    });
    const item = target?.products?.[0];
    const otherName = find(
      newest,
      row =>
        !!row.products?.[0]?.product?.name &&
        trim(row.products[0].product.name) !== trim(item?.product?.name ?? "")
    )?.products?.[0]?.product?.name;
    if (!target || !item?.product?.name || !otherName)
      throw new Error(
        "No placed order with an item name, a category and a service " +
          "identifier. Escalate."
      );
    corpus.narrowTarget = {
      name: trim(item.product.name),
      otherName: trim(otherName),
      category: trim(item.product.category?.name ?? ""),
      service: item.service_identifier ?? "",
      number: target.number,
      total: target.total_amount
    };
  }, 120000);

  describe("List only the orders I placed", () => {
    const scenario = "List only the orders I placed";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("I open my order history", () =>
      recordStep(scenario, "I open my order history", recordOrderBoot()));
  });

  describe("Read my order list with its brand and item counts", () => {
    const scenario = "Read my order list with its brand and item counts";

    // The first page must hold an order of several items: place one through
    // the real client order flow when the newest ten hold none.
    beforeAll(async () => {
      const { body } = await selfCall(
        `/api/invoices?filter[category.slug]=${InvoiceCategoryCode.NEW_CONTRACT}` +
          "&with_count=products&order=-create_datetime&limit=10",
        clientToken.access_token
      );
      const rows =
        (body as { data?: Array<{ products_count?: number }> })?.data ?? [];
      if (find(rows, row => Number(row.products_count) > 1)) return;
      const line = {
        product_id: ARRANGE_PRODUCTS.recurring,
        quantity: 1,
        billing_cycle_months: 1
      };
      const order = await arrangeCall(
        "POST",
        "/api/orders",
        clientToken.access_token,
        {
          category_slug: InvoiceCategoryCode.NEW_CONTRACT,
          products: [line, line]
        }
      );
      const basketId = (order.body as { data?: { id?: string } })?.data?.id;
      const convert = basketId
        ? await arrangeCall(
            "PATCH",
            `/api/orders/${basketId}/convert`,
            clientToken.access_token,
            { type: PaymentType.PAY_LATER, amount: 0 }
          )
        : order;
      if (!(convert.body as { data?: { id?: string } })?.data?.id)
        throw new Error(
          `${scenario}: placing an order of several items failed — ` +
            JSON.stringify(convert.body)
        );
    }, 60000);

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("I open my order history", () =>
      recordStep(scenario, "I open my order history", recordOrderBoot()));
  });

  // The replay keys a list read without `limit`, `offset` and `order`, so each
  // page move is its own step: one step answers one page.
  describe("Page through my orders and choose the page size", () => {
    const scenario = "Page through my orders and choose the page size";
    const given = "I have more orders than fit on one page";
    const moves: Array<[string, { limit?: number; offset: number }]> = [
      ["I go to the next page", { offset: 10 }],
      [
        "going to page three gives me the orders of page three, ten a page",
        { offset: 20 }
      ],
      [
        "going back one page gives me the orders of page two again",
        { offset: 10 }
      ],
      [
        "choosing five orders a page takes me back to page one, five a page",
        { limit: 5, offset: 0 }
      ]
    ];

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () => recordStep(scenario, given, recordOrderBoot()));
    for (const [step, page] of moves)
      it(step, () =>
        recordStep(scenario, step, generator =>
          generator.get(orderListUrl("", page))
        )
      );
  });

  describe("Read a search of my orders that matches nothing as empty", () => {
    const scenario = "Read a search of my orders that matches nothing as empty";
    const given = "no order of mine has the number I search for";
    const when = "I search my orders for that number";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () => recordStep(scenario, given, recordOrderBoot()));
    it(when, () =>
      recordStep(scenario, when, generator =>
        generator.get(orderListUrl(`&filter[number|eq]=${NO_SUCH_ORDER}`))
      )
    );
  });

  describe("Go back to the first page when my page has no orders", () => {
    const scenario = "Go back to the first page when my page has no orders";
    const given = "my orders are narrowed to none";
    const when = "I ask for page two";
    const none = `&filter[number|eq]=${NO_SUCH_ORDER}`;

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () =>
      recordStep(scenario, given, async generator => {
        await recordOrderBoot()(generator);
        await generator.get(orderListUrl(none));
      })
    );
    it(when, () =>
      recordStep(scenario, when, generator =>
        generator.get(orderListUrl(none, { offset: 10 }))
      )
    );
  });

  // The page-nine read and the last-page read share one replay key, so the
  // step holds the page-nine answer: no row at that offset, and the total.
  describe("Land on the last page when I ask for a page past it", () => {
    const scenario = "Land on the last page when I ask for a page past it";
    const given = "I have orders on three pages";
    const when = "I ask for page nine";
    const threePages = (): string =>
      `&filter[create_datetime|gte]=${encodeURIComponent(corpus.threePagesFrom)}`;

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () =>
      recordStep(scenario, given, async generator => {
        await recordOrderBoot()(generator);
        const { body } = await generator.get(orderListUrl(threePages()));
        const total = (body as { total?: number })?.total ?? 0;
        if (total < 21 || total > 30)
          throw new Error(
            `${scenario}: the narrowing holds ${total} orders, not three pages of ten.`
          );
      })
    );
    it(when, () =>
      recordStep(scenario, when, generator =>
        generator.get(orderListUrl(threePages(), { offset: 80 }))
      )
    );
  });

  describe("Narrow my orders by item, category, service, number and amount", () => {
    const scenario =
      "Narrow my orders by item, category, service, number and amount";
    const given =
      "I am on page two of my orders of several products and amounts";
    const when =
      "I narrow my orders by item name, product category, service, number or total";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () =>
      recordStep(scenario, given, async generator => {
        await recordOrderBoot()(generator);
        await generator.get(orderListUrl("", { offset: 10 }));
      })
    );
    it(when, () =>
      recordStep(scenario, when, async generator => {
        const t = corpus.narrowTarget;
        const like = (value: string): string =>
          encodeURIComponent(`%${value}%`);
        const name = `&filter[products.product.name|like]=${like(t.name)}`;
        const category = `&filter[products.product.category.name|like]=${like(t.category)}`;
        const service = `&filter[products.service_identifier|like]=${like(t.service)}`;
        const number = `&filter[number|eq]=${encodeURIComponent(t.number)}`;
        const total = `&filter[total_amount|eq]=${t.total}`;
        await generator.get(
          orderListUrl(
            `&filter[products.product.name|like]=${like(t.otherName)}`
          )
        );
        await generator.get(orderListUrl(name));
        await generator.get(orderListUrl(name + category));
        await generator.get(orderListUrl(name + category + service));
        await generator.get(orderListUrl(name + category + service + number));
        const { body } = await generator.get(
          orderListUrl(name + category + service + number + total)
        );
        if (!(body as { total?: number })?.total)
          throw new Error(`${scenario}: the narrowing returned no order.`);
      })
    );
  });

  describe("Narrow my orders by when I placed or paid them", () => {
    const scenario = "Narrow my orders by when I placed or paid them";
    const given = "I have orders placed and paid on different dates";
    const when =
      "I narrow my orders to the last seven days, or to a date I give";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () => recordStep(scenario, given, recordOrderBoot()));
    it(when, () =>
      recordStep(scenario, when, async generator => {
        const placed = "&filter[create_datetime|after]=-7_days";
        await generator.get(orderListUrl(placed));
        await generator.get(
          orderListUrl(
            `${placed}&filter[paid_datetime|gte]=${encodeURIComponent(corpus.paidFrom)}`
          )
        );
      })
    );
  });

  describe("Narrow my orders by status", () => {
    const scenario = "Narrow my orders by status";
    const given = "I have paid, unpaid and adjusted orders";
    const when =
      "I narrow my orders to the unpaid ones, then to all but the paid ones";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () => recordStep(scenario, given, recordOrderBoot()));
    it(when, () =>
      recordStep(scenario, when, async generator => {
        await generator.get(orderListUrl(UNPAID_CHOICE));
        await generator.get(
          orderListUrl("&filter[status.code|neq]=invoice_paid")
        );
      })
    );
  });

  // The refused write sends nothing, so its step records nothing.
  describe("Refuse an equal and a not-equal status narrowing together", () => {
    const scenario =
      "Refuse an equal and a not-equal status narrowing together";
    const given = "my orders are narrowed to the unpaid ones";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () =>
      recordStep(scenario, given, async generator => {
        await recordOrderBoot()(generator);
        await generator.get(orderListUrl(UNPAID_CHOICE));
      })
    );
  });

  // The three sorts share one replay key, so the step holds the last sort.
  describe("Sort my orders and stay on my page", () => {
    const scenario = "Sort my orders and stay on my page";
    const given = "I am on page two of my orders, newest first";
    const when =
      "I sort my orders by total, then by status, then by order number";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () =>
      recordStep(scenario, given, async generator => {
        await recordOrderBoot()(generator);
        await generator.get(orderListUrl("", { offset: 10 }));
      })
    );
    it(when, () =>
      recordStep(scenario, when, async generator => {
        await generator.get(
          orderListUrl("", { offset: 10, order: "total_amount" })
        );
        await generator.get(
          orderListUrl("", { offset: 10, order: "status_id" })
        );
        await generator.get(orderListUrl("", { offset: 10, order: "id" }));
      })
    );
  });

  describe("Find one order by its number while a filter is on", () => {
    const scenario = "Find one order by its number while a filter is on";
    const given =
      "my orders are narrowed to the unpaid ones and then to one product category, and I am on page two";
    const when = "I search for one order number";
    const category = (): string =>
      "&filter[products.product.category.name|like]=" +
      encodeURIComponent(`%${corpus.unpaidCategory}%`);
    const narrowed = (): string => `${UNPAID_CHOICE}${category()}`;
    const number = (): string =>
      `&filter[number|eq]=${encodeURIComponent(corpus.unpaidNumber)}`;

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () =>
      recordStep(scenario, given, async generator => {
        await recordOrderBoot()(generator);
        await generator.get(orderListUrl(UNPAID_CHOICE));
        await generator.get(orderListUrl(narrowed()));
        await generator.get(orderListUrl(narrowed(), { limit: 2, offset: 0 }));
        const { body } = await generator.get(
          orderListUrl(narrowed(), { limit: 2, offset: 2 })
        );
        if (((body as { data?: unknown[] })?.data ?? []).length === 0)
          throw new Error(`${scenario}: page two of the narrowing is empty.`);
        // The read a replacing filterBy sends in place of the merge: recorded
        // so its negative control fails on the kept-filters step by name.
        await generator.get(orderListUrl(category(), { limit: 2, offset: 2 }));
      })
    );
    it(when, () =>
      recordStep(scenario, when, async generator => {
        await generator.get(
          orderListUrl(narrowed() + number(), { limit: 2, offset: 0 })
        );
        await generator.get(
          orderListUrl(category() + number(), { limit: 2, offset: 0 })
        );
      })
    );
  });

  describe("Only my last number search or number filter narrows my orders", () => {
    const scenario =
      "Only my last number search or number filter narrows my orders";
    const when =
      "I filter my orders to the number of A, then search for B, then filter to the number of A again";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("I have two orders, A and B", () =>
      recordStep(scenario, "I have two orders, A and B", recordOrderBoot()));
    it(when, () =>
      recordStep(scenario, when, async generator => {
        await generator.get(
          orderListUrl(
            `&filter[number|eq]=${encodeURIComponent(corpus.numberA)}`
          )
        );
        await generator.get(
          orderListUrl(
            `&filter[number|eq]=${encodeURIComponent(corpus.numberB)}`
          )
        );
      })
    );
  });

  // --- one order (useInvoice().withId(id)) -----------------------------------

  type OrderDetail = {
    id: string;
    number?: string;
    paid_amount?: number;
    unpaid_amount_converted?: number;
    status?: { code?: string };
    delegate_related?: boolean;
    products?: Array<{ billing_cycle_months?: number; options?: unknown[] }>;
    current_data?: {
      content?: {
        products?: Array<{
          billing_cycle_months?: number;
          options?: unknown[];
          product?: { id?: string; image?: { full_url?: string } | null };
        }>;
      };
    } | null;
  };

  const readOrder = async (id: string): Promise<OrderDetail | undefined> =>
    (
      (await selfCall(
        `/api/invoices/${id}?${LOAD_ONE_WITH}`,
        clientToken.access_token
      )) as { body?: { data?: OrderDetail } }
    ).body?.data;

  /** The newest placed order the client holds in `status`, read in full. */
  async function orderIn(
    status: string,
    match: (order: OrderDetail) => boolean = () => true
  ): Promise<string> {
    const rows = await readOrders(`limit=50&filter[status.code]=${status}`);
    for (const row of rows) {
      const order = await readOrder(row.id);
      if (order && match(order)) return order.id;
    }
    throw new Error(
      `No placed order in ${status} matches its scenario. Escalate.`
    );
  }

  /** Records the detail reads one order opens with into a scenario step. */
  const recordOrderDetail =
    (id: () => string) =>
    async (generator: Generator): Promise<void> => {
      await recordDetailReads(generator, brandId, clientId, id());
    };

  const orderIds = {
    opened: "",
    items: "",
    images: "",
    unpaid: "",
    overdue: "",
    paid: "",
    partlyPaid: "",
    cancelled: "",
    delegated: ""
  };

  // A read of one order and a read of a missing one share a replay key, so the
  // missing order is opened by the Given and the order by the When.
  describe("Open one of my orders", () => {
    const scenario = "Open one of my orders";
    const given = "one of my orders and an order number that does not exist";
    const when = "I open each of them, then reload the first";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () =>
      recordStep(scenario, given, generator =>
        recordDetailReads(
          generator,
          brandId,
          clientId,
          "00000000-0000-0000-0000-000000000000"
        )
      )
    );
    it(when, async () => {
      orderIds.opened = (await readOrders("limit=1"))[0].id;
      return recordStep(
        scenario,
        when,
        recordOrderDetail(() => orderIds.opened)
      );
    });
  });

  // The snapshot of the chosen order disagrees with its live products on the
  // billing term, so an item read from the live products is told apart.
  describe("Read the items of one of my orders", () => {
    const scenario = "Read the items of one of my orders";
    const given =
      "one of my orders with a subscription, options and a snapshot";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(
      given,
      async () => {
        const rows = filter(
          (await readOrders("limit=2000&with_count=products")) as Array<
            CorpusOrder & { products_count?: number }
          >,
          row => Number(row.products_count) > 1
        );
        for (const row of rows) {
          const order = await readOrder(row.id);
          const snapshot = order?.current_data?.content?.products ?? [];
          const live = order?.products ?? [];
          const differs = some(
            snapshot,
            (item, index) =>
              item.billing_cycle_months !== live[index]?.billing_cycle_months
          );
          if (
            differs &&
            some(snapshot, item => Number(item.billing_cycle_months) > 0) &&
            some(snapshot, item => size(item.options) > 0)
          ) {
            orderIds.items = row.id;
            break;
          }
        }
        if (!orderIds.items)
          throw new Error(
            `${scenario}: no placed order whose snapshot differs from its live items. Escalate.`
          );
        return recordStep(
          scenario,
          given,
          recordOrderDetail(() => orderIds.items)
        );
      },
      600000
    );
  });

  describe("See the catalogue image of each item I ordered", () => {
    const scenario = "See the catalogue image of each item I ordered";
    const given = "one of my orders whose snapshot items have catalogue images";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(
      given,
      async () => {
        const rows = filter(
          (await readOrders("limit=100&with_count=products")) as Array<
            CorpusOrder & { products_count?: number }
          >,
          row => Number(row.products_count) > 1
        );
        for (const row of rows) {
          const order = await readOrder(row.id);
          const snapshot = order?.current_data?.content?.products ?? [];
          if (
            size(snapshot) > 1 &&
            some(snapshot, item => !!item.product?.image?.full_url)
          ) {
            orderIds.images = row.id;
            break;
          }
        }
        if (!orderIds.images)
          throw new Error(
            `${scenario}: no placed order with several snapshot items and a catalogue image. Escalate.`
          );
        return recordStep(
          scenario,
          given,
          recordOrderDetail(() => orderIds.images)
        );
      },
      600000
    );
  });

  for (const [scenario, given, pick] of [
    [
      "Read an unpaid order as due and payable",
      "one of my orders is unpaid",
      async () =>
        orderIn(InvoiceStatus.UNPAID, order => !Number(order.paid_amount))
    ],
    [
      "Read an overdue order as overdue",
      "one of my orders is overdue",
      async () =>
        orderIn(InvoiceStatus.OVERDUE, order => !Number(order.paid_amount))
    ],
    [
      "Read a paid order as paid",
      "one of my orders is paid",
      async () =>
        orderIn(InvoiceStatus.PAID, order => Number(order.paid_amount) > 0)
    ],
    [
      "Read a partly paid order as partly paid",
      "one of my orders is partly paid",
      async () => {
        const id = await arrangePartlyPaid(clientToken.access_token, clientId);
        if (!id)
          throw new Error("Could not arrange a partly paid order. Escalate.");
        return id;
      }
    ],
    [
      "Read a cancelled order as cancelled",
      "one of my orders is cancelled",
      async () =>
        orderIn(InvoiceStatus.CANCELLED, order => !Number(order.paid_amount))
    ]
  ] as const) {
    describe(scenario, () => {
      it(BG, () => recordStep(scenario, BG, recordBoot));
      it(
        given,
        async () => {
          const id = await pick();
          return recordStep(
            scenario,
            given,
            recordOrderDetail(() => id)
          );
        },
        600000
      );
    });
  }

  // Recorded as the delegate MEMBER reading an order the delegate owner placed
  // (the house shape of "A delegated invoice is not mine to settle"): the
  // owner's own order, never a sub-account's, so it reads as delegated.
  describe("Read an order of a client who delegated to me as delegated", () => {
    const scenario =
      "Read an order of a client who delegated to me as delegated";
    const given = "a client delegated one of their orders to me";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(
      given,
      async () => {
        const member = await mintToken({
          grant_type: GrantTypes.PASSWORD,
          username: API_CREDENTIALS.delegateMember.username,
          password: API_CREDENTIALS.delegateMember.password
        });
        const owner = await mintToken({
          grant_type: GrantTypes.PASSWORD,
          username: API_CREDENTIALS.delegateOwner.username,
          password: API_CREDENTIALS.delegateOwner.password
        });
        if (!member || !owner)
          throw new Error(`${scenario}: no delegate member or owner token.`);
        const ownerOrder = await ensureArrangedInvoice(
          owner.access_token,
          ARRANGE_PRODUCTS.recurring,
          24
        );
        const read = await arrangeCall(
          "GET",
          `/api/invoices/${ownerOrder}?with=category`,
          member.access_token
        );
        const order = (
          read.body as {
            data?: { delegate_related?: boolean; category?: { slug?: string } };
          }
        )?.data;
        if (
          !ownerOrder ||
          !order?.delegate_related ||
          order.category?.slug !== InvoiceCategoryCode.NEW_CONTRACT
        )
          throw new Error(
            `${scenario}: the owner's order is not delegated to the member — ${JSON.stringify(read.body)?.slice(0, 300)}`
          );
        const ownerId =
          (await lookupDelegatedClientId(member.access_token, "")) ?? "";
        return recordStep(scenario, given, async generator => {
          generator.setBearerToken(member.access_token);
          await recordDetailReads(generator, brandId, ownerId, ownerOrder);
        });
      },
      600000
    );
  });

  describe("Read the row of each of my orders", () => {
    const scenario = "Read the row of each of my orders";
    const given = "I have paid and cancelled orders";
    const when =
      "I narrow my orders to the paid ones, then to the cancelled ones";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(given, () => recordStep(scenario, given, recordOrderBoot()));
    it(when, () =>
      recordStep(scenario, when, async generator => {
        for (const status of [InvoiceStatus.PAID, InvoiceStatus.CANCELLED]) {
          const { body } = await generator.get(
            orderListUrl(`&filter[status.code|eq]=${status}`)
          );
          if (!(body as { total?: number })?.total)
            throw new Error(
              `${scenario}: the client holds no ${status} order.`
            );
        }
      })
    );
  });

  describe("Read the row of an order a client delegated to me", () => {
    const scenario = "Read the row of an order a client delegated to me";
    const when = "I open my order history";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(when, async () => {
      const member = await mintToken({
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.delegateMember.username,
        password: API_CREDENTIALS.delegateMember.password
      });
      if (!member) throw new Error(`${scenario}: no delegate member token.`);
      return recordStep(scenario, when, async generator => {
        generator.setBearerToken(member.access_token);
        const { body } = await generator.get(orderListUrl());
        const rows =
          (body as { data?: Array<{ delegate_related?: boolean }> })?.data ??
          [];
        if (!some(rows, row => !!row.delegate_related))
          throw new Error(
            `${scenario}: the member's order history holds no delegated order.`
          );
        generator.setBearerToken(clientToken.access_token);
        await recordProbes(generator);
      });
    });
  });

  describe("Read the details of one of my orders", () => {
    const scenario = "Read the details of one of my orders";
    const given = "one of my orders that was cancelled with a reason";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it(
      given,
      async () => {
        const id = await orderIn(
          InvoiceStatus.CANCELLED,
          order =>
            !!(order as { contract?: { cancellation_reason?: string } | null })
              .contract?.cancellation_reason
        );
        return recordStep(
          scenario,
          given,
          recordOrderDetail(() => id)
        );
      },
      600000
    );
  });

  // The credit-notes write drops its undeclared column, so its read is the
  // boot read the Given already holds.
  describe("Keep my order history to the orders I placed", () => {
    const scenario = "Keep my order history to the orders I placed";
    const when =
      "I narrow it by a filter, then by the credit-notes narrowing, then by a search, then by a raw criteria write that names another category";

    it(BG, () => recordStep(scenario, BG, recordBoot));
    it("my order history is open", () =>
      recordStep(scenario, "my order history is open", recordOrderBoot()));
    it(when, () =>
      recordStep(scenario, when, async generator => {
        await generator.get(
          orderListUrl("&filter[status.code|eq]=invoice_paid")
        );
        await generator.get(
          orderListUrl(
            `&filter[number|eq]=${encodeURIComponent(corpus.numberA)}`
          )
        );
        await generator.get(
          orderListUrl(`&filter[total_amount|eq]=${corpus.narrowTarget.total}`)
        );
      })
    );
  });
});
