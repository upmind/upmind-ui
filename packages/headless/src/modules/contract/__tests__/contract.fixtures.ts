// -----------------------------------------------------------------------------
/**
 * @fileoverview Contract API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `contracts[...]` endpoints the `contract` module hits for
 * its ONE in-scope cell (client x self) and (re)generate their sanitised v3
 * fixtures into this module's OWN co-located `fixtures/` dir. Run on demand:
 *
 *   pnpm fixtures:generate contract
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

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
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
