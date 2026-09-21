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
 * ## Captures (design.md §8.1, §8.3)
 * `get-contracts` (list — AC-14) ·
 * `get-contracts-id` (the 12-member client read — AC-3) ·
 * `patch-contracts-id-payment_details` (AC-8, `setPaymentMethod`, idempotent
 * against the account's own default method — this staging client carries only
 * ONE payment method, so no genuinely DIFFERENT `payment_details_id` exists to
 * capture a value CHANGE from; the endpoint's own 200 shape is real) ·
 * `post-contracts-id-cancel-request` (AC-6, `requestCancellation`, a REAL 200
 * against a real subscription product) · `delete-contracts-id-cancel-request`
 * (AC-7, `withdrawCancellation`, the REAL response staging answers).
 *
 * ## Recording limits (surfaced, not papered over)
 * 1. `setPaymentMethod` has no real SECOND stored method on this staging
 *    client to switch to — `contract.mutations.int.test.ts` documents the
 *    same limit and asserts the wire contract (body shape, URL, identity)
 *    against the idempotent real 200 rather than a value transition.
 * 2. **`withdrawCancellation`'s real capture is a 404, not a 200.** Reading
 *    the contract back straight after the POST above shows the
 *    `cancellation_request` object IS created and readable (a real id, a real
 *    `request_cancellation_request` status). `DELETE
 *    api/contracts/{id}/cancel/request` against that same contract, seconds
 *    later, answers `404 "Contract Request not found!"` — verbatim, and
 *    reproducible across repeat runs. A `PUT` probe against the same path
 *    (never captured, not part of design.md's contract) answers `405` naming
 *    `GET, HEAD, POST, DELETE` as the supported methods, so `DELETE` is a real
 *    route on this exact path — the object the withdraw handler looks up is
 *    the one that does not resolve, not the route. Two ids-in-path variants
 *    (`.../cancel/request/{requestId}`, `/api/cancel_requests/{id}`) were
 *    probed uncaptured and both 404 as unknown routes, so design.md's
 *    id-less path is the real route. **This 404 is shipped as the capture**
 *    rather than forced to a fabricated 200 — `contract.mutations.int.test.ts`
 *    asserts the module surfaces this real error rather than a happy-path
 *    withdrawal, and flags the design.md AC-7 wire contract for operator
 *    review against this finding.
 * 3. The staging client's real 422/409 refusal bodies for a cancel request on
 *    an already-cancelling product, or a payment-method write to a contract
 *    the client does not own, are NOT captured here — the token this run
 *    holds cannot reach either state without seeding a second real account,
 *    which is out of scope for this generator. The action-level refusal
 *    (ADR-25/ADR-27) is proven at the unit layer against the module's own
 *    guard logic instead (`contract.utils.test.ts` deferral table).
 *
 * ## Staging hygiene
 * The cancellation request this run lodges is real and, per limit 2 above,
 * this run cannot withdraw it again through any route design.md or this
 * generator's probes found. It is left as the account's real state; a
 * subsequent `pnpm fixtures:generate contract` run selects a different clean
 * subscription (one with no `contract_request`) rather than reusing this one.
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

/** The 12 `with` members of the client contract read (design.md §8.1). */
const CONTRACT_WITH = [
  "products.contract_request",
  "products.contract_request.custom_fields.field",
  "products.future_cancellation_request",
  "products.product.image",
  "products.product.brand.currency",
  "cancellation_request",
  "cancellation_request.custom_fields.field",
  "products.status",
  "products.tags",
  "client.image",
  "status",
  "cancellation_request.status"
].join(",");

type WireContract = { id: string };
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
  let defaultPaymentDetailsId: string;

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
    let resolved: WireContractProduct | undefined;
    for (const candidate of subscriptions) {
      const probe = await call(
        "GET",
        `/api/contracts/${candidate.contract_id}?with=cancellation_request`,
        clientToken.access_token
      );
      const hasRequest = Boolean(
        (probe.body as { data?: { cancellation_request?: unknown } })?.data
          ?.cancellation_request
      );
      if (!hasRequest) {
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
    const resolvedClientId = clientId?.actor?.id ?? clientId?.id;
    if (!resolvedClientId) {
      throw new Error("Could not resolve the client id from /self.");
    }

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
  }, 60000);

  afterAll(() => {
    generator.save();
  }, 30000);

  // --- reads ------------------------------------------------------------

  it("captures GET /api/contracts (list — AC-14)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/contracts?pagination[limit]=10"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Contracts list capture returned ${status}.`);
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

  it("captures DELETE /api/contracts/{id}/cancel/request (AC-7 — a REAL 404, see fileoverview limit 2)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/contracts/${contractId}/cancel/request`
    );
    generator.clearBearerToken();
    // A real 404 is the capture under test here (limit 2) — shipped as-is,
    // never forced to a fabricated 200. Only a genuine transport failure
    // (5xx / network) fails this capture.
    if (status >= 500) {
      throw new Error(`Withdraw-cancellation capture returned ${status}.`);
    }
  });
});
