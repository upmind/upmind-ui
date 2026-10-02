// -----------------------------------------------------------------------------
/**
 * @fileoverview Contract API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `contracts[...]` endpoints the `contract` module hits for
 * its ONE in-scope cell (client x self) and (re)generate their sanitised v3
 * fixtures into this module's OWN co-located `fixtures/` dir — the one-offs
 * the unit tests and the labs forced states read — and record every driven
 * `contract.feature` scenario into `scenarios/<slug>/<NN>/` (FE-3145, ADR 035).
 * Run on demand:
 *
 *   pnpm fixtures:generate contract
 *   pnpm fixtures:generate contract --scenario "<collection scenario title>"
 *   pnpm fixtures:generate contract --scenario "Contract manager scenarios"
 *
 * The manager scenarios share one arranged subscription, so they are recorded
 * together under the one `describe` that holds them.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix. It has no assertions beyond "the capture
 * happened"; `save()` in `afterAll` writes every capture once.
 *
 * ## Captures (`design ✅.md` §8.1, §8.3)
 * `get-contracts` (list — AC-14) ·
 * `get-contracts-id` (the 8-member client read after ruling R34 — AC-3) ·
 * `get-clients-id-payment-details` (the stored cards the payment-method form
 * offers — AC-8, D3) ·
 * `patch-contracts-id-payment_details` (AC-8, `setPaymentMethod`, idempotent
 * against the account's own default method — the endpoint's own 200 shape is
 * real) · `patch-contracts-id-payment_details?case=different-card` (AC-8, a
 * REAL value CHANGE to a second stored card — captured ONLY when staging holds
 * two; see limit 1) · `post-contracts-id-cancel-request` (AC-6,
 * `requestCancellation`, a REAL 200 against a real subscription product) ·
 * `delete-contracts-id-cancel-request` (AC-7, `withdrawCancellation`, the REAL
 * response staging answers).
 *
 * ## Recording limits (surfaced, not papered over)
 * 1. The genuinely-different-card change (`case=different-card`) is captured
 *    ONLY when the staging client holds two or more stored methods. When it
 *    holds one, the capture SKIPS with the real card count logged, and the
 *    payment-method-change journey stays spec-only — never faked with a second
 *    card that does not exist. `contract.mutations.int.test.ts` documents the
 *    same limit and asserts the wire contract (body shape, URL, identity)
 *    against the idempotent real 200 rather than a value transition.
 * 2. `withdrawCancellation` is recorded with the body the module sends,
 *    `{ contract_request_id }` (legacy `cProdProvider.vue:1327-1362`), and
 *    staging answers it with a real 200. A second capture names a request that
 *    does not exist, which records the real 404 refusal.
 * 3. The staging client's real 422/409 refusal bodies for a cancel request on
 *    an already-cancelling product, or a payment-method write to a contract
 *    the client does not own, are NOT captured here — the token this run
 *    holds cannot reach either state without seeding a second real account,
 *    which is out of scope for this generator. The action-level refusal
 *    (ADR-25/ADR-27) is proven at the unit layer against the module's own
 *    guard logic instead (`contract.utils.test.ts` deferral table).
 *
 * ## Staging hygiene
 * The run withdraws the request it lodges, and before it picks a candidate it
 * withdraws any request an earlier run left behind, so the sandbox stays clean.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes, PaymentType } from "@upmind-automation/types";
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
import { forEach, map } from "lodash-es";
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

/** The 3 `with` members the list view model maps (`design ✅.md` §8.1, R19, R30). */
const CONTRACTS_LIST_WITH = [
  "status",
  "cancellation_request",
  "cancellation_request.status"
].join(",");

/** The 8 `with` members of the client contract read after ruling R34: the
 * contract keeps only contract facts, so the product cancellation members
 * (`products.contract_request`, `products.contract_request.custom_fields.field`,
 * `products.future_cancellation_request`) and `cancellation_request.custom_fields.field`
 * are DROPPED — each product loads its own cancellation state through
 * `useContractProduct`. Kept in lockstep with `CONTRACT_WITH_MEMBERS` in
 * `contract.reads.int.test.ts`, which asserts the module sends exactly these. */
const CONTRACT_WITH = [
  "products.product.image",
  "products.product.brand.currency",
  "cancellation_request",
  "products.status",
  "products.tags",
  "client.image",
  "status",
  "cancellation_request.status"
].join(",");

type WireContractProduct = {
  id: string;
  contract_id: string;
  billing_cycle_months: number;
  status?: { code: string };
  contract_request?: unknown;
};

// -----------------------------------------------------------------------------

/** Plain, UNCAPTURED authed call — used for id lookup and staging restore. */
async function call(
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

// -----------------------------------------------------------------------------

describe("Contract API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let contractId: string;
  let subscriptionProductId: string;
  let resolvedClientId: string;
  let defaultPaymentDetailsId: string;
  /** A stored method DIFFERENT from the one the contract pays with today, when
   * the staging client holds two or more. Undefined when it holds only one —
   * in which case the genuinely-different-card change stays uncaptured and is
   * surfaced, never faked (see fileoverview limit 1). */
  let differentPaymentDetailsId: string | undefined;
  let lodgedRequestIdOf: (id: string) => Promise<string | undefined>;

  async function contractRecordOf(
    id: string
  ): Promise<{ main_invoice_number?: string; total_amount?: number }> {
    const { body } = await call(
      "GET",
      `/api/contracts/${id}`,
      clientToken.access_token
    );
    const record = (
      body as { data?: { main_invoice_number?: string; total_amount?: number } }
    )?.data;
    if (!record) throw new Error(`Contract ${id} is not readable.`);
    return record;
  }

  async function orderNumberOf(id: string): Promise<string> {
    const { main_invoice_number } = await contractRecordOf(id);
    if (!main_invoice_number) {
      throw new Error(`Contract ${id} carries no order number to search by.`);
    }
    return main_invoice_number;
  }

  async function totalAmountOf(id: string): Promise<string> {
    const { total_amount } = await contractRecordOf(id);
    if (total_amount == null) {
      throw new Error(`Contract ${id} carries no total to narrow by.`);
    }
    return String(total_amount);
  }

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "contract"
    });

    clientToken = await mintClientToken();

    // This sandbox auto-resolves a lodged cancellation request within
    // seconds (see fileoverview limit 2), so the contract-level uniqueness
    // constraint self-clears — no cross-contract lookup is needed, just an
    // active real subscription product.
    const activeProductsResp = await call(
      "GET",
      "/api/contracts_products?with=status&filter[status.code]=contract_active&limit=50",
      clientToken.access_token
    );
    const activeProducts = ((
      activeProductsResp.body as {
        data?: WireContractProduct[];
      }
    )?.data ?? []) as WireContractProduct[];
    const subscriptions = activeProducts.filter(
      product => product.billing_cycle_months > 0
    );
    if (subscriptions.length === 0) {
      throw new Error(
        "No real active subscription product on the staging client — the " +
          "cancel-request/withdraw capture has nothing to address."
      );
    }

    // Several of these candidates may already carry a lodged cancellation
    // request from an earlier recording run (see fileoverview limit 2) —
    // probe each real candidate, uncaptured, until one contract answers with
    // no existing request.
    lodgedRequestIdOf = async (id: string) =>
      (
        (
          await call(
            "GET",
            `/api/contracts/${id}?with=cancellation_request`,
            clientToken.access_token
          )
        ).body as { data?: { cancellation_request?: { id?: string } } }
      )?.data?.cancellation_request?.id;

    let resolved: WireContractProduct | undefined;
    for (const candidate of subscriptions) {
      const lodged = await lodgedRequestIdOf(candidate.contract_id);
      // A request an earlier run lodged is withdrawn the way the module does
      // it (`DELETE …/cancel/request` with its `contract_request_id`), so the
      // sandbox returns to a clean candidate.
      if (lodged) {
        await call(
          "DELETE",
          `/api/contracts/${candidate.contract_id}/cancel/request`,
          clientToken.access_token,
          { contract_request_id: lodged }
        );
      }
      if (!(await lodgedRequestIdOf(candidate.contract_id))) {
        resolved = candidate;
        break;
      }
    }
    if (!resolved) {
      throw new Error(
        "Every real active subscription's contract already carries a " +
          "lodged cancellation request — no clean candidate to capture " +
          "AC-6 from. Wait for this sandbox's auto-resolution (limit 2) " +
          "and re-run."
      );
    }
    subscriptionProductId = resolved.id;
    contractId = resolved.contract_id;

    const selfResp = await call(
      "GET",
      "/api/self?with=actor",
      clientToken.access_token
    );
    const clientId = (
      selfResp.body as { data?: { actor?: { id?: string }; id?: string } }
    )?.data;
    const resolvedId = clientId?.actor?.id ?? clientId?.id;
    if (!resolvedId) {
      throw new Error("Could not resolve the client id from /self.");
    }
    resolvedClientId = resolvedId;

    const paymentResp = await call(
      "GET",
      `/api/clients/${resolvedClientId}/payment_details`,
      clientToken.access_token
    );
    const methods = ((
      paymentResp.body as { data?: { id: string; default?: boolean }[] }
    )?.data ?? []) as { id: string; default?: boolean }[];
    const defaultMethod = methods.find(method => method.default) ?? methods[0];
    if (!defaultMethod) {
      throw new Error(
        "The staging client has no stored payment method — the " +
          "setPaymentMethod capture has nothing to select."
      );
    }
    defaultPaymentDetailsId = defaultMethod.id;
    // A second, genuinely DIFFERENT stored method is what a real change needs
    // (task source 3). Whether staging offers one is surfaced by the capture
    // below — never faked when it does not.
    differentPaymentDetailsId = methods.find(
      method => method.id !== defaultPaymentDetailsId
    )?.id;

    console.log(
      `[contract.fixtures] staging client holds ${methods.length} stored ` +
        `payment method(s); different-card capture ${
          differentPaymentDetailsId ? "IS" : "is NOT"
        } possible.`
    );
  }, 60000);

  afterAll(() => {
    generator.save();
  }, 30000);

  // --- reads ------------------------------------------------------------

  it("captures GET /api/contracts (list — AC-14)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contracts?pagination[limit]=10&with=${CONTRACTS_LIST_WITH}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Contracts list capture returned ${status}.`);
    }
  });

  it("captures GET /api/contracts ordered by name, named contracts first (R38 items 7, 8, 13)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contracts?case=named-first&with=${CONTRACTS_LIST_WITH}&order=-name&limit=10&offset=0`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Named-first contracts capture returned ${status}.`);
    }
  });

  it("captures GET /api/contracts searched by one contract's order number (the quick search — R38 item 13)", async () => {
    const orderNumber = await orderNumberOf(contractId);
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contracts?case=search-order-number&with=${CONTRACTS_LIST_WITH}&query=${encodeURIComponent(orderNumber)}&limit=10&offset=0`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Order-number search capture returned ${status}.`);
    }
  });

  it("captures GET /api/contracts narrowed by one contract's order number and total (legacy's order and total filters — R38 item 13)", async () => {
    const orderNumber = await orderNumberOf(contractId);
    const total = await totalAmountOf(contractId);
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contracts?case=filter-order-total&with=${CONTRACTS_LIST_WITH}&filter[main_invoice_number]=${encodeURIComponent(orderNumber)}&filter[total_amount]=${encodeURIComponent(total)}&limit=10&offset=0`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Order-and-total filter capture returned ${status}.`);
    }
  });

  it.each([
    "contract_cancelled",
    "contract_suspended",
    "contract_awaiting_activation",
    "contract_fraud"
  ])(
    "captures GET /api/contracts narrowed to %s (one real row per status badge — R38 item 9)",
    async code => {
      generator.setBearerToken(clientToken.access_token);
      const { status } = await generator.get(
        `/api/contracts?case=status-${code}&with=${CONTRACTS_LIST_WITH}&filter[status.code]=${code}&limit=1&offset=0`
      );
      generator.clearBearerToken();
      if (status !== 200) {
        throw new Error(`The ${code} list capture returned ${status}.`);
      }
    }
  );

  it("captures GET /api/contracts ordered by an undeclared column (the real list failure — R38 item 6)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contracts?case=list-failure&with=${CONTRACTS_LIST_WITH}&order=not_a_contract_column&limit=10&offset=0`
    );
    generator.clearBearerToken();
    if (status < 400) {
      throw new Error(
        `The undeclared-order list answered ${status}, not a refusal.`
      );
    }
  });

  it("captures GET /api/contracts/{id} (the 12-member client read — AC-3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contracts/${contractId}?with_staged_imports=1&with=${CONTRACT_WITH}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Contract read capture returned ${status}.`);
    }
  });

  it("captures GET /api/contracts/{id} for an id I do not own (the real read failure)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contracts/00000000-0000-0000-0000-000000000000?case=not-found&with_staged_imports=1&with=${CONTRACT_WITH}`
    );
    generator.clearBearerToken();
    if (status < 400) {
      throw new Error(
        `The unknown-contract read answered ${status}, not a refusal.`
      );
    }
  });

  // --- mutations ----------------------------------------------------------

  it("captures PATCH /api/contracts/{id}/payment_details (AC-8, idempotent — see fileoverview limit 1)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.patch(
      `/api/contracts/${contractId}/payment_details`,
      { payment_details_id: defaultPaymentDetailsId }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Payment-method capture returned ${status}.`);
    }
  });

  it("captures GET /api/clients/{id}/payment_details (the stored cards the payment-method form offers — AC-8, D3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${resolvedClientId}/payment_details?active=true`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Stored-cards read capture returned ${status}.`);
    }
  });

  it("captures PATCH /api/contracts/{id}/payment_details selecting a DIFFERENT stored card (AC-8, a real value CHANGE)", async () => {
    if (!differentPaymentDetailsId) {
      console.warn(
        "[contract.fixtures] SKIP different-card PATCH: the staging client " +
          "holds only ONE stored payment method, so no genuinely different " +
          "payment_details_id exists to capture a value CHANGE from. The " +
          "payment-method-change journey stays spec-only until staging offers " +
          "a second card (task source 3)."
      );
      return;
    }
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.patch(
      `/api/contracts/${contractId}/payment_details?case=different-card`,
      { payment_details_id: differentPaymentDetailsId }
    );
    generator.clearBearerToken();
    // Restore the contract to the method it paid with before this capture, so
    // the sandbox is left as it was found.
    await call(
      "PATCH",
      `/api/contracts/${contractId}/payment_details`,
      clientToken.access_token,
      { payment_details_id: defaultPaymentDetailsId }
    );
    if (status >= 400) {
      throw new Error(
        `Different-card payment-method capture returned ${status}: ${JSON.stringify(body)}`
      );
    }
  });

  it("captures POST /api/contracts/{id}/cancel/request (AC-6)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/contracts/${contractId}/cancel/request`,
      {
        product_ids: [subscriptionProductId],
        cancellation_reason: "prover fixture capture — withdrawn same run"
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Cancel-request capture returned ${status}: ${JSON.stringify(body)}`
      );
    }
  });

  it("captures DELETE /api/contracts/{id}/cancel/request (AC-7, with the request's contract_request_id)", async () => {
    const requestId = await lodgedRequestIdOf(contractId);
    if (!requestId) {
      throw new Error("The request the AC-6 capture lodged is not readable.");
    }
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.delete(
      `/api/contracts/${contractId}/cancel/request`,
      { contract_request_id: requestId }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Withdraw-cancellation capture returned ${status}: ${JSON.stringify(body)}`
      );
    }
  });

  it("captures PATCH /api/contracts/{id}/payment_details naming a method that is not an id (the real refused write)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.patch(
      `/api/contracts/${contractId}/payment_details?case=invalid-method`,
      { payment_details_id: "not-a-payment-method" }
    );
    generator.clearBearerToken();
    if (status < 400) {
      await call(
        "PATCH",
        `/api/contracts/${contractId}/payment_details`,
        clientToken.access_token,
        { payment_details_id: defaultPaymentDetailsId }
      );
    }
    if (status < 400 || status === 401 || status === 404) {
      throw new Error(
        `The invalid-method write answered ${status}, not a servable refusal: ` +
          `${JSON.stringify(body)}`
      );
    }
  });

  it("captures DELETE /api/contracts/{id}/cancel/request naming a request that does not exist (the real refusal)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/contracts/${contractId}/cancel/request?case=unknown-request`,
      { contract_request_id: "00000000-0000-0000-0000-000000000000" }
    );
    generator.clearBearerToken();
    if (status < 400) {
      throw new Error(
        `The unknown-request withdraw answered ${status}, not a refusal.`
      );
    }
  });
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035 + Am.1) — one recording per `contract.feature`
// scenario, one folder per step, named from the feature by `recordedStepDir`.
// Each scenario arranges the staging state its steps need, records the
// requests its steps make in their order, and puts staging back. The staff
// token only ARRANGES: it never makes a recorded request.
//
// Arranged state: a Starter Hosting monthly subscription and a one-off
// purchase, each created fresh through the client's own order → convert
// (pay later) flow, settled by a staff manual payment through the offline
// gateway, and closed again once the run ends. Every status a scenario needs
// (suspended, cancelled, lapsed) is set with the staff `manual_status_on` and
// lifted again with `manual_status_off`; every payment-method change is set
// back to the method the contract paid with before.
// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "contract.feature"),
  "utf-8"
);

/** The Background step every signed-in scenario opens with. */
const BG = "I am an authenticated client acting on my own contracts";

const STARTER_HOSTING = "3de78642-de53-9714-76df-21208469530d";
const ONE_OFF_PRODUCT = "47d73824-8507-9315-9e0b-81e642d59e06";
const OFFLINE_GATEWAY = "4d036794-24d0-e710-275c-3153698d582e";
const NOT_A_CONTRACT = "00000000-0000-0000-0000-000000000000";

const PAGE_SIZE = 10;
const CHOSEN_PAGE_SIZE = 5;

const LIST_QUERY = `with=${CONTRACTS_LIST_WITH}&lang=en`;
const READ_QUERY = `with=${CONTRACT_WITH}&with_staged_imports=1&lang=en`;

type Arranged = { contractId: string; cpId: string };

describe("Contract scenario recordings", () => {
  let clientToken: IToken;
  let staffToken: IToken;
  let clientId: string;
  let brandId: string;
  let cardIds: string[] = [];
  const prepared = new Set<string>();
  const created: Arranged[] = [];
  let subscription: Arranged | undefined;
  let oneOff: Arranged | undefined;
  let cardless: Arranged | undefined;

  const asClient = (method: string, path: string, body?: unknown) =>
    call(method, path, clientToken.access_token, body);
  const asStaff = (method: string, path: string, body?: unknown) =>
    call(method, path, staffToken.access_token, body);

  /** Records the requests ONE step makes into that step's own folder. */
  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>,
    token: IToken = clientToken
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        feature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "contract"
    });
    generator.setBearerToken(token.access_token);
    await requests(generator);
    generator.save();
  }

  const nothing = async (): Promise<void> => undefined;

  const listUrl = (criteria: string): string =>
    `/api/contracts?${LIST_QUERY}&${criteria}`;
  const page = (offset: number, limit = PAGE_SIZE): string =>
    listUrl(`order=created_at&limit=${limit}&offset=${offset}`);
  const readUrl = (id: string): string => `/api/contracts/${id}?${READ_QUERY}`;
  const cardsUrl = (id: string): string =>
    `/api/clients/${id}/payment_details?limit=0&brand_id=${brandId}` +
    `&active=true&with=gateway,client&order=-default,id&lang=en`;

  const readFirstPage = (generator: Generator) => generator.get(page(0));

  /** The manager's load: the contract, then the stored cards its form offers. */
  const readContract =
    (id: string, owner = clientId) =>
    async (generator: Generator) => {
      await generator.get(readUrl(id));
      await generator.get(cardsUrl(owner));
    };

  /** Orders one product pay-later, settles its invoice with a staff payment. */
  async function arrangeContract(
    productId: string,
    billingCycleMonths: number,
    { withCard } = { withCard: true }
  ): Promise<Arranged> {
    const order = await asClient("POST", "/api/orders", {
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
    const convert = await asClient("PATCH", `/api/orders/${basketId}/convert`, {
      type: PaymentType.PAY_LATER,
      amount: 0
    });
    const invoiceId = (convert.body as { data?: { id?: string } })?.data?.id;
    const invoice = (
      await asClient("GET", `/api/invoices/${invoiceId}?with=products`)
    ).body as {
      data?: {
        currency_id?: string;
        total_amount?: number;
        products?: { contract_id?: string; contracts_product_id?: string }[];
      };
    };
    const line = invoice?.data?.products?.[0];
    if (!line?.contract_id || !line.contracts_product_id)
      throw new Error(
        `Arranging a contract for ${productId} failed: order ${order.status}, convert ${convert.status}.`
      );

    await asStaff("POST", "/api/admin/payments/manual", {
      invoice_id: invoiceId,
      client_id: clientId,
      amount: Math.max(1, Number(invoice.data?.total_amount ?? 1)),
      gateway_id: OFFLINE_GATEWAY,
      currency_id: invoice.data?.currency_id
    });
    await asStaff(
      "PUT",
      `/api/admin/contracts/${line.contract_id}/products/${line.contracts_product_id}/activate`
    );

    const arranged = {
      contractId: line.contract_id,
      cpId: line.contracts_product_id
    };
    created.push(arranged);
    if (withCard) await setCard(arranged, cardIds[0]);
    return arranged;
  }

  async function ensureSubscription(): Promise<Arranged> {
    subscription ??= await arrangeContract(STARTER_HOSTING, 1);
    return subscription;
  }

  async function ensureCardless(): Promise<Arranged> {
    cardless ??= await arrangeContract(STARTER_HOSTING, 1, { withCard: false });
    return cardless;
  }

  async function ensureOneOff(): Promise<Arranged> {
    oneOff ??= await arrangeContract(ONE_OFF_PRODUCT, 0);
    return oneOff;
  }

  async function setCard(target: Arranged, cardId: string): Promise<void> {
    const { status } = await asClient(
      "PATCH",
      `/api/contracts/${target.contractId}/payment_details`,
      { payment_details_id: cardId }
    );
    if (status !== 200)
      throw new Error(
        `Setting the arranged contract's card answered ${status}.`
      );
  }

  async function setStatus(target: Arranged, statusCode: string) {
    const { status } = await asStaff(
      "PATCH",
      `/api/admin/contracts/${target.contractId}/products/${target.cpId}/manual_status_on`,
      { status_code: statusCode }
    );
    if (status !== 200)
      throw new Error(`Setting ${statusCode} answered ${status}.`);
  }

  async function liftStatus(target: Arranged): Promise<void> {
    await asStaff(
      "PATCH",
      `/api/admin/contracts/${target.contractId}/products/${target.cpId}/manual_status_off`,
      { real_time: true }
    );
  }

  async function lodgeCancellationRequest(target: Arranged): Promise<void> {
    const { status } = await asClient(
      "POST",
      `/api/contracts/${target.contractId}/cancel/request`,
      {
        product_ids: [target.cpId],
        cancellation_reason: "FE-3145 scenario recording — withdrawn same run"
      }
    );
    if (status !== 200)
      throw new Error(`Lodging the cancellation request answered ${status}.`);
  }

  async function withdrawCancellationRequest(target: Arranged): Promise<void> {
    const { body } = await asClient(
      "GET",
      `/api/contracts/${target.contractId}?with=cancellation_request`
    );
    const requestId = (
      body as { data?: { cancellation_request?: { id?: string } } }
    )?.data?.cancellation_request?.id;
    if (requestId)
      await asClient(
        "DELETE",
        `/api/contracts/${target.contractId}/cancel/request`,
        { contract_request_id: requestId }
      );
  }

  const changeCard =
    (target: Arranged, cardId: string) => async (generator: Generator) => {
      await generator.patch(
        `/api/contracts/${target.contractId}/payment_details`,
        { payment_details_id: cardId }
      );
      await generator.get(readUrl(target.contractId));
    };

  beforeAll(async () => {
    clientToken = await mintClientToken();
    staffToken = await mintStaffToken();

    const self = (await asClient("GET", "/api/self?with=actor")).body as {
      data?: { id?: string; actor?: { id?: string } };
    };
    clientId = self?.data?.actor?.id ?? self?.data?.id ?? "";
    brandId = String(
      (
        (await asClient("GET", "/api/brand/settings")).body as {
          data?: { id?: string };
        }
      )?.data?.id ?? ""
    );
    cardIds = map(
      (
        (
          await asClient(
            "GET",
            `/api/clients/${clientId}/payment_details?active=true`
          )
        ).body as { data?: { id: string }[] }
      )?.data ?? [],
      "id"
    );
    if (!clientId || !brandId || cardIds.length < 2)
      throw new Error(
        `Cannot record the contract scenarios: client ${!!clientId}, brand ${!!brandId}, ${cardIds.length} stored card(s) (two are needed).`
      );
  }, 60000);

  afterAll(async () => {
    for (const target of created)
      await setStatus(target, "contract_closed").catch(() => undefined);
  }, 60000);

  // === WITHOUT A SIGNED-IN CLIENT ==========================================
  // The guest session asks the contracts API for nothing, so each step folder
  // stays empty and the replay wall proves the silence: a contract request
  // any step made would fail its scenario by name.

  const SIGNED_OUT =
    "my client session has ended and I am signed out of my contracts";
  const ONE_SIGNED_OUT =
    "One of my contracts is not read or changed without an authenticated client session";

  forEach(
    [
      {
        scenario:
          "My contracts list is not read without an authenticated client session",
        steps: [
          "I ask for my contracts",
          "my contracts report themselves unavailable to me",
          "no request is made for my contracts"
        ]
      },
      ...map(
        [
          "I open one of my contracts while signed out",
          "I force a change to my contract's payment method"
        ],
        use => ({
          scenario: `${ONE_SIGNED_OUT} — ${use}`,
          steps: [
            use,
            "the contract reports itself unavailable to me",
            "no request is made for that contract"
          ]
        })
      )
    ],
    ({ scenario, steps }) =>
      describe(scenario, () => {
        forEach([SIGNED_OUT, ...steps], step =>
          it(step, () => recordStep(scenario, step, nothing))
        );
      })
  );

  // === THE CONTRACTS COLLECTION ============================================

  describe("See the first page of my contracts", () => {
    const scenario = "See the first page of my contracts";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it("I open my contracts", () =>
      recordStep(scenario, "I open my contracts", nothing));
    forEach(
      [
        "I see the first page of my contracts, oldest first",
        "I am told which page I am on and how many contracts I have",
        "my list asks for one page of contracts, assuming no page position of its own",
        "each contract shows when it next bills, its billing cycle, when I bought it and its price, as it was read"
      ],
      step => it(step, () => recordStep(scenario, step, nothing))
    );
  });

  const OPENED =
    "I have opened my contracts, and they run to more than one page";

  describe("Move forward to the next page of my contracts", () => {
    const scenario = "Move forward to the next page of my contracts";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(OPENED, () => recordStep(scenario, OPENED, nothing));
    it("I move forward to the next page", () =>
      recordStep(scenario, "I move forward to the next page", generator =>
        generator.get(page(PAGE_SIZE))
      ));
    it("the next page of my contracts comes back", () =>
      recordStep(
        scenario,
        "the next page of my contracts comes back",
        nothing
      ));
  });

  describe("Move back to the previous page of my contracts", () => {
    const scenario = "Move back to the previous page of my contracts";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(OPENED, () => recordStep(scenario, OPENED, nothing));
    it("I have moved on to the second page of them", () =>
      recordStep(
        scenario,
        "I have moved on to the second page of them",
        generator => generator.get(page(PAGE_SIZE))
      ));
    it("I move back to the previous page", () =>
      recordStep(scenario, "I move back to the previous page", readFirstPage));
    it("the first page of my contracts comes back", () =>
      recordStep(
        scenario,
        "the first page of my contracts comes back",
        nothing
      ));
  });

  describe("Jump to the last page of my contracts", () => {
    const scenario = "Jump to the last page of my contracts";
    const LAST =
      "the last page of my contracts comes back, and I am told there is no further page to go to";
    let total = 0;
    it(BG, () =>
      recordStep(scenario, BG, async generator => {
        const { body } = await readFirstPage(generator);
        total = Number((body as { total?: number })?.total ?? 0);
      })
    );
    it(OPENED, () => recordStep(scenario, OPENED, nothing));
    it("I move forward to the last page", () =>
      recordStep(scenario, "I move forward to the last page", generator =>
        generator.get(page(Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE))
      ));
    it(LAST, () => recordStep(scenario, LAST, nothing));
  });

  describe("Choose how many of my contracts come on one page", () => {
    const scenario = "Choose how many of my contracts come on one page";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(OPENED, () => recordStep(scenario, OPENED, nothing));
    it("I choose how many of my contracts come on one page", () =>
      recordStep(
        scenario,
        "I choose how many of my contracts come on one page",
        generator => generator.get(page(0, CHOSEN_PAGE_SIZE))
      ));
    it("my contracts come that many at a time", () =>
      recordStep(scenario, "my contracts come that many at a time", nothing));
  });

  const activeOnly = (generator: Generator) =>
    generator.get(
      listUrl(
        `filter[status.code]=contract_active&order=created_at&limit=${PAGE_SIZE}&offset=0`
      )
    );

  describe("Narrow my contracts to the ones in one state", () => {
    const scenario = "Narrow my contracts to the ones in one state";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(OPENED, () => recordStep(scenario, OPENED, nothing));
    it("I narrow my contracts to the active ones", () =>
      recordStep(
        scenario,
        "I narrow my contracts to the active ones",
        activeOnly
      ));
    forEach(
      ["only my active contracts come back", "I am told my list is narrowed"],
      step => it(step, () => recordStep(scenario, step, nothing))
    );
  });

  describe("Clear my narrowing to see my whole list again", () => {
    const scenario = "Clear my narrowing to see my whole list again";
    const NARROWED = "I have narrowed my contracts to the active ones";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(NARROWED, () => recordStep(scenario, NARROWED, activeOnly));
    it("I clear the narrowing", () =>
      recordStep(scenario, "I clear the narrowing", readFirstPage));
    forEach(
      [
        "I am no longer told my list is narrowed",
        "my whole list of contracts comes back"
      ],
      step => it(step, () => recordStep(scenario, step, nothing))
    );
  });

  const billsLatestFirst = (generator: Generator) =>
    generator.get(listUrl(`order=-next_due_date&limit=${PAGE_SIZE}&offset=0`));

  describe("Order my contracts by when they next bill, latest first", () => {
    const scenario = "Order my contracts by when they next bill, latest first";
    const ORDER = "I order my contracts by when they next bill, latest first";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(OPENED, () => recordStep(scenario, OPENED, nothing));
    it(ORDER, () => recordStep(scenario, ORDER, billsLatestFirst));
    it("my contracts come back in that order", () =>
      recordStep(scenario, "my contracts come back in that order", nothing));
  });

  describe("An order I empty falls back to oldest first", () => {
    const scenario = "An order I empty falls back to oldest first";
    const ORDERED =
      "I have ordered my contracts by when they next bill, latest first";
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(ORDERED, () => recordStep(scenario, ORDERED, billsLatestFirst));
    it("I empty the order", () =>
      recordStep(scenario, "I empty the order", readFirstPage));
    it("my contracts come back oldest first again", () =>
      recordStep(
        scenario,
        "my contracts come back oldest first again",
        nothing
      ));
  });

  describe("Read my contracts again to see how they stand now", () => {
    const scenario = "Read my contracts again to see how they stand now";
    const NARROWED =
      "I have narrowed my contracts to the suspended ones, newest first";
    const AGAIN =
      "I read my contracts again after one more of them is suspended";
    const suspendedNewestFirst = (generator: Generator) =>
      generator.get(
        listUrl(
          `filter[status.code]=contract_suspended&order=-created_at&limit=${PAGE_SIZE}&offset=0`
        )
      );
    it(BG, () => recordStep(scenario, BG, readFirstPage));
    it(NARROWED, async () => {
      await ensureSubscription();
      await recordStep(scenario, NARROWED, suspendedNewestFirst);
    });
    it(AGAIN, async () => {
      const target = await ensureSubscription();
      await setStatus(target, "contract_suspended");
      await recordStep(scenario, AGAIN, suspendedNewestFirst).finally(() =>
        liftStatus(target)
      );
    });
    it("my list shows the contract that was suspended since I last read it", () =>
      recordStep(
        scenario,
        "my list shows the contract that was suspended since I last read it",
        nothing
      ));
  });

  // === THE MANAGER =========================================================
  // Every manager scenario acts on the SAME arranged subscription, so a step
  // several scenarios share reads the contract id and the stored cards off one
  // recording and addresses exactly the contract each scenario recorded. They
  // are therefore recorded together, in one run:
  //
  //   pnpm fixtures:generate contract --scenario "Contract manager scenarios"
  describe("Contract manager scenarios", () => {
    const WITH_REQUEST = "one of my contracts has a cancellation request on it";
    const OPEN_IT = "I open that contract";

    /** Records a scenario opened on the subscription with a cancellation request lodged. */
    function describeCancellationRequestRead(
      scenario: string,
      thens: string[]
    ) {
      describe(scenario, () => {
        it(BG, () => recordStep(scenario, BG, readFirstPage));
        it(WITH_REQUEST, async () => {
          await ensureSubscription();
          await recordStep(scenario, WITH_REQUEST, nothing);
        });
        it(OPEN_IT, async () => {
          const target = await ensureSubscription();
          await lodgeCancellationRequest(target);
          await recordStep(
            scenario,
            OPEN_IT,
            readContract(target.contractId)
          ).finally(() => withdrawCancellationRequest(target));
        });
        forEach(thens, step =>
          it(step, () => recordStep(scenario, step, nothing))
        );
      });
    }

    describeCancellationRequestRead(
      "Open one of my contracts with everything the account area needs",
      [
        "it names the very contract I opened, titled by the order it was bought under",
        "it arrives with the cancellation request on it",
        "it arrives with the contract's own status and my account's image",
        "it lists each of its products by name and id, with its status, its tags, its catalogue image and its brand's currency",
        "my stored payment methods are loaded ready for the payment-method form",
        "its lifecycle state is named in the platform's own contract vocabulary",
        "the state of the cancellation request on it is named in the platform's own cancellation vocabulary"
      ]
    );

    const OPEN_ONE = "I have one of my contracts open in the manager";

    describe("When reading a contract fails I am shown why, instead of the contract I had open", () => {
      const scenario =
        "When reading a contract fails I am shown why, instead of the contract I had open";
      const OTHER = "I open the manager on a contract that is not one of mine";
      it(BG, () => recordStep(scenario, BG, readFirstPage));
      it(OPEN_ONE, async () => {
        const target = await ensureSubscription();
        await recordStep(scenario, OPEN_ONE, readContract(target.contractId));
      });
      it(OTHER, () =>
        recordStep(scenario, OTHER, async generator => {
          const { status } = await generator.get(readUrl(NOT_A_CONTRACT));
          if (status < 400)
            throw new Error(`The unknown-contract read answered ${status}.`);
        })
      );
      forEach(
        [
          "I am shown the reason the failed read returned",
          "the manager has stopped loading, reports an error and tells me at once the contract is not ready",
          "it does not hold the contract I had open"
        ],
        step => it(step, () => recordStep(scenario, step, nothing))
      );
    });

    describe("Reset my contract to read it again as it now stands", () => {
      const scenario = "Reset my contract to read it again as it now stands";
      const RESET = "I reset my contract after it has been suspended";
      it(BG, () => recordStep(scenario, BG, readFirstPage));
      it(OPEN_ONE, async () => {
        const target = await ensureSubscription();
        await recordStep(scenario, OPEN_ONE, readContract(target.contractId));
      });
      it(RESET, async () => {
        const target = await ensureSubscription();
        await setStatus(target, "contract_suspended");
        await recordStep(
          scenario,
          RESET,
          readContract(target.contractId)
        ).finally(() => liftStatus(target));
      });
      it("my contract is shown to me as suspended, with no error", () =>
        recordStep(
          scenario,
          "my contract is shown to me as suspended, with no error",
          nothing
        ));
    });

    // === CHANGING HOW A CONTRACT IS PAID FOR =================================

    const FORM_OPEN = "I have opened the payment-method form";
    const FORM_OPEN_CHOSEN =
      "I have opened the payment-method form, with a different stored card chosen";
    const BILLS_CHOSEN = "that contract now bills against the method I chose";
    const BILLS_AS_BEFORE =
      "that contract still bills against the method it had";

    type PaymentScenario = {
      scenario: string;
      given: string;
      arrange: () => Promise<Arranged>;
      statusCode?: string;
      token?: () => Promise<IToken>;
      keepsNoCard?: boolean;
      steps: [step: string, change: boolean][];
    };

    /**
     * Records one payment-method scenario: the contract read (and its stored
     * cards) in the Given, the PATCH to the SECOND stored card (and the re-read)
     * in the step that sends it, nothing in every other step. The arranged
     * status is lifted and the card put back once the scenario is recorded.
     */
    function describePaymentScenario(spec: PaymentScenario): void {
      describe(spec.scenario, () => {
        let target: Arranged;
        let token: IToken;
        let owner: string;

        beforeAll(async () => {
          target = await spec.arrange();
          token = spec.token ? await spec.token() : clientToken;
          owner = spec.token ? await resolveActorId(token) : clientId;
          if (spec.statusCode) await setStatus(target, spec.statusCode);
        }, 120000);

        afterAll(async () => {
          if (spec.statusCode) await liftStatus(target);
          if (!spec.keepsNoCard) await setCard(target, cardIds[0]);
        }, 60000);

        it(BG, () => recordStep(spec.scenario, BG, readFirstPage));
        it(spec.given, () =>
          recordStep(
            spec.scenario,
            spec.given,
            readContract(target.contractId, owner),
            token
          )
        );
        forEach(spec.steps, ([step, change]) =>
          it(step, () =>
            recordStep(
              spec.scenario,
              step,
              change ? changeCard(target, cardIds[1]) : nothing,
              token
            )
          )
        );
      });
    }

    async function resolveActorId(token: IToken): Promise<string> {
      const { body } = await call(
        "GET",
        "/api/self?with=actor",
        token.access_token
      );
      return (
        (body as { data?: { actor?: { id?: string } } })?.data?.actor?.id ?? ""
      );
    }

    const ACTIVE =
      "I have my active subscription open in the manager, paying by one of my stored methods";

    const CHANGE_STEPS: PaymentScenario["steps"] = [
      [FORM_OPEN, false],
      [
        "I choose a different stored card and submit the payment-method form",
        true
      ],
      ["the change is saved and the form closes with no error", false],
      [
        "that contract now bills against the method I chose, and the change reached only my own contract",
        false
      ]
    ];

    describePaymentScenario({
      scenario:
        "Point my active subscription at a different stored payment method",
      given: ACTIVE,
      arrange: ensureSubscription,
      steps: CHANGE_STEPS
    });

    forEach(
      [
        ["suspended", "contract_suspended"],
        ["cancelled", "contract_cancelled"],
        ["lapsed", "contract_closed"]
      ],
      ([standing, statusCode]) =>
        describePaymentScenario({
          scenario: `Point my ${standing} subscription at a different stored payment method`,
          given: `I have my ${standing} subscription open in the manager, paying by one of my stored methods`,
          arrange: ensureSubscription,
          statusCode,
          steps: CHANGE_STEPS
        })
    );

    describePaymentScenario({
      scenario: "Choose a stored payment method for a contract that has none",
      given:
        "I have a subscription of mine open in the manager that pays by no stored method",
      arrange: ensureCardless,
      keepsNoCard: true,
      steps: [
        [
          "I have opened the payment-method form, which starts with no method chosen",
          false
        ],
        [
          "I choose a different stored card and submit the payment-method form",
          true
        ],
        ["the change is saved and the form closes with no error", false],
        [BILLS_CHOSEN, false]
      ]
    });

    const TRY_CHANGE = "I try to change how it is paid for";
    const NOT_OPENED = "the payment-method form does not open";

    describePaymentScenario({
      scenario:
        "I am not offered a payment-method change on a one-off purchase",
      given:
        "I have my one-off purchase open in the manager, paying by one of my stored methods",
      arrange: ensureOneOff,
      steps: [
        [TRY_CHANGE, false],
        [NOT_OPENED, false],
        [BILLS_AS_BEFORE, false]
      ]
    });

    // The delegate MEMBER reads the recording client's subscription: that client
    // delegates to the member in full, so each product reads `is_delegated_object`.
    describePaymentScenario({
      scenario:
        "I am not offered a payment-method change on a subscription delegated to me",
      given:
        "I have a subscription delegated to me open in the manager, paying by one of its owner's stored methods",
      arrange: ensureSubscription,
      token: () =>
        mintToken({
          grant_type: GrantTypes.PASSWORD,
          username: API_CREDENTIALS.delegateMember.username,
          password: API_CREDENTIALS.delegateMember.password
        }),
      steps: [
        [TRY_CHANGE, false],
        [NOT_OPENED, false],
        [BILLS_AS_BEFORE, false]
      ]
    });

    forEach(
      [
        [
          "Nothing is sent when I select no method at all",
          "I submit the payment-method form with no method chosen"
        ],
        [
          "Nothing is sent when I select the method my contract already uses",
          "I submit the payment-method form with the method my contract already uses"
        ]
      ],
      ([scenario, when]) =>
        describePaymentScenario({
          scenario,
          given: ACTIVE,
          arrange: ensureSubscription,
          steps: [
            [FORM_OPEN, false],
            [when, false],
            [BILLS_AS_BEFORE, false]
          ]
        })
    );

    describePaymentScenario({
      scenario:
        "Close the payment-method form without changing how my contract is paid for",
      given: ACTIVE,
      arrange: ensureSubscription,
      steps: [
        [FORM_OPEN_CHOSEN, false],
        ["I close the payment-method form", false],
        [
          "the payment-method form is closed and that contract still bills against the method it had",
          false
        ],
        [
          "the next time I open the payment-method form it starts on the method my contract pays with",
          false
        ]
      ]
    });

    describePaymentScenario({
      scenario:
        "While my payment-method change is being sent I am told it is in progress",
      given: ACTIVE,
      arrange: ensureSubscription,
      steps: [
        [FORM_OPEN_CHOSEN, false],
        [
          "I submit the payment-method form and the change has not landed yet",
          true
        ],
        ["I am told the change is in progress", false],
        [
          "once it lands I am told it is done, and that contract bills against the method I chose",
          false
        ]
      ]
    });
  });
});
