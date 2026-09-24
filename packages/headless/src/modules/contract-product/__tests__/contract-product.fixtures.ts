// -----------------------------------------------------------------------------
/**
 * @fileoverview Contract-Product API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `contract_products[...]` / `contracts/{c}/products/{p}[...]`
 * endpoints the `contract-product` module hits for its ONE in-scope cell
 * (client x self) and (re)generate their sanitised v3 fixtures into this
 * module's OWN co-located `fixtures/` dir. Run on demand:
 *
 *   pnpm fixtures:generate contract-product
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix. It has no assertions beyond "the capture
 * happened"; `save()` in `afterAll` writes every capture once.
 *
 * ## Captures (`design ✅.md` §8.1, §8.3)
 * `get-contracts_products` (list — AC-1) ·
 * `get-contract_products-id` (the 35-member client read — AC-4/AC-15) ·
 * `put-contracts-id-products-id-modify_renew-case-stop` /
 * `-case-resume` (AC-5, `requestSoftCancel` / `abortSoftCancel` — a real
 * subscription stopped, then resumed, in the same run) ·
 * `put-contracts-id-products-id-properties` (AC-9, `setConsolidation`,
 * idempotent against the product's own current value — see limit 1) ·
 * `put-contracts-id-products-id-schedule-cancel` /
 * `-schedule-cancel-revoke` (AC-22/AC-23, `scheduleCancellation` /
 * `revokeScheduledCancellation` — booked then revoked in the same run).
 *
 * ## Recording limits (surfaced, not papered over)
 * 1. `setConsolidation` sends the product's CURRENT `invoice_consolidation_enabled`
 *    value back — a real 200, not a fabricated value transition. This
 *    staging client's products all carry the same recorded value, so no
 *    genuinely DIFFERENT value exists to capture a change from without
 *    guessing the platform's `InvoiceConsolidationTypes` numbering, which
 *    this generator does not read (implementation source is withheld from
 *    the prover seat).
 * 2. The real 4xx refusal bodies for a staged/cancelled/lapsed product, or a
 *    one-off purchase's consolidation attempt, are NOT captured here — this
 *    staging client's reachable products do not include one in those states.
 *    `contract-product.utils.test.ts` proves the client-side guard shape at
 *    the unit layer instead.
 * 3. **`design ✅.md` §8.3's wire route for `scheduleCancellation` /
 *    `revokeScheduledCancellation` is `PUT api/contract_products/{p}/…` —
 *    that exact path answers a real, reproducible `404 "API route not
 *    found"`.** Three sibling shapes were probed uncaptured
 *    (`contract_products/{p}/schedule_cancel`, `.../schedule-cancellation`,
 *    `contracts_products/{p}/schedule-cancel`) and all three also 404.
 *    **`PUT api/contracts/{c}/products/{p}/schedule-cancel` / `…-revoke`**
 *    — the shape `contract-product.types.ts`'s own body-type comments
 *    already carry, and the same nesting `modify_renew` and `properties`
 *    use — is the real route (a real `409 "Scheduled cancellation already
 *    exists!"` on first probe, then a clean book/revoke pair once that
 *    pre-existing real schedule was revoked). **This generator captures
 *    the real route** and flags `design ✅.md` §8.3's stated wire path for
 *    operator correction against this finding.
 *
 * ## Staging hygiene
 * The renewal stop this run performs is resumed again in the same run
 * (`renew: true`), and the scheduled cancellation this run books is revoked
 * again in the same run — both real, reversible writes against a real
 * subscription, left exactly as found.
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

/**
 * The 9 `with` members of the dashboard grouped-counts read (`design ✅.md`
 * §8.1): the products-list 12 minus the three `clients*` members `withParam`
 * compacts away once a client id is supplied [o2 `:48`, o5 `:241`].
 */
const GROUPED_WITH = [
  "status",
  "product.image",
  "brand.currency",
  "product.provision_blueprint",
  "contract_request",
  "future_cancellation_request",
  "moved_to_contract_product",
  "moved_to_contract_product.clients",
  "tags"
].join(",");

/** The 35 `with` members of the client product detail read (`design ✅.md` §8.1). */
const PRODUCT_WITH = [
  "contract",
  "contract.account",
  "contract.address",
  "contract.brand.currency",
  "contract.cancellation_request.status",
  "contract.cancellation_request.custom_fields.field",
  "contract.client",
  "contract.client.tags",
  "contract.client.image",
  "contract.gateway",
  "contract.import.credentials",
  "contract.import.source",
  "contract.moved_to_contract",
  "contract.moved_to_contract.products",
  "contract.payment_details",
  "contract.payment_details.gateway",
  "contract.promotions",
  "contract.status",
  "allowed_migrations",
  "attributes.product.image",
  "brand",
  "contract_request",
  "contract_request.custom_fields.field",
  "future_cancellation_request",
  "options.product.image",
  "product",
  "product.brand.currency",
  "product.image",
  "product.images",
  "product.provision_blueprint",
  "product.provision_category",
  "scheduled_actions",
  "status",
  "tags",
  "unpaid_recurring_invoices"
].join(",");

type WireProduct = {
  id: string;
  contract_id: string;
  billing_cycle_months: number;
  renew: boolean;
  invoice_consolidation_enabled: number;
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

describe("Contract-Product API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let contractId: string;
  let productId: string;
  let currentConsolidation: number;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "contract-product"
    });

    clientToken = await mintClientToken();

    const selfResp = await call("GET", "/api/self", clientToken.access_token);
    const selfData = (
      selfResp.body as {
        data?: { actor?: { id?: string }; actor_id?: string };
      }
    )?.data;
    const actorId = selfData?.actor?.id ?? selfData?.actor_id;
    if (!actorId) {
      throw new Error(
        `Could not resolve the client id from /api/self (status ${selfResp.status}); ` +
          `data keys: ${JSON.stringify(Object.keys(selfData ?? {}))} — ` +
          "the grouped-counts read is addressed by client id."
      );
    }
    clientId = actorId;

    const productsResp = await call(
      "GET",
      "/api/contracts_products?with=status,contract_request&filter[status.code]=contract_active&limit=50",
      clientToken.access_token
    );
    const products = ((productsResp.body as { data?: WireProduct[] })?.data ??
      []) as WireProduct[];
    // A product already carrying a real `contract_request` reads as
    // `available.status.cancelling` (flow.md §3) — STOP_RENEWING has no
    // transition from that node, so the renew-stop capture needs a genuinely
    // clean subscription, not merely an active one.
    const subscription = products.find(
      product =>
        product.billing_cycle_months > 0 &&
        product.renew &&
        !product.contract_request
    );
    if (!subscription) {
      throw new Error(
        "No real active, renewing, NOT-cancelling subscription product on " +
          "the staging client — the renew-stop/resume capture has nothing " +
          "clean to address."
      );
    }
    productId = subscription.id;
    contractId = subscription.contract_id;
    currentConsolidation = subscription.invoice_consolidation_enabled;
  }, 60000);

  afterAll(() => {
    generator.save();
  }, 30000);

  // --- reads ------------------------------------------------------------

  it("captures GET /api/contracts_products (list — AC-1)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/contracts_products?split_count=1&limit=10"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Products list capture returned ${status}.`);
    }
  });

  it("captures GET /api/contract_products/{id} (the 35-member client read — AC-4/AC-15)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Product read capture returned ${status}.`);
    }
  });

  it("captures GET /api/clients/{clientId}/contracts/products grouped counts (AC-19)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/contracts/products` +
        `?limit=count` +
        `&group_count=products.category_id,service_identifier` +
        `&order=service_identifier` +
        `&filter[status.code]=contract_active` +
        `&with=${GROUPED_WITH}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Grouped-counts capture returned ${status}.`);
    }
  });

  // --- mutations ----------------------------------------------------------

  it("captures PUT .../modify_renew {renew:false} then {renew:true} (AC-5)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const stop = await generator.put(
      `/api/contracts/${contractId}/products/${productId}/modify_renew?case=stop`,
      { renew: false }
    );
    const resume = await generator.put(
      `/api/contracts/${contractId}/products/${productId}/modify_renew?case=resume`,
      { renew: true }
    );
    generator.clearBearerToken();
    if (stop.status >= 400 || resume.status >= 400) {
      throw new Error(
        `Renew stop/resume capture returned ${stop.status}/${resume.status}.`
      );
    }
  });

  it("captures PUT .../properties (AC-9, idempotent — see fileoverview limit 1)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/contracts/${contractId}/products/${productId}/properties`,
      { invoice_consolidation_enabled: currentConsolidation }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Consolidation capture returned ${status}.`);
    }
  });

  it("captures PUT .../schedule-cancel then .../schedule-cancel-revoke (AC-22/AC-23, real route — see fileoverview limit 3)", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const route = (suffix: string): string =>
      `/api/contracts/${contractId}/products/${productId}/${suffix}`;

    // A prior real schedule may already exist on this product (this run's
    // own probe, or genuine account history) — clear it uncaptured first so
    // the captured book/revoke pair below starts clean.
    await call(
      "PUT",
      route("schedule-cancel-revoke"),
      clientToken.access_token,
      {}
    ).catch(() => undefined);

    generator.setBearerToken(clientToken.access_token);
    const book = await generator.put(route("schedule-cancel"), {
      future_cancellation_date: futureDate
    });
    if (book.status >= 400) {
      generator.clearBearerToken();
      throw new Error(
        `Schedule-cancel capture returned ${book.status}: ` +
          `${JSON.stringify(book.body)}`
      );
    }
    const revoke = await generator.put(route("schedule-cancel-revoke"), {});
    generator.clearBearerToken();
    if (revoke.status >= 400) {
      throw new Error(
        `Schedule-cancel-revoke capture returned ${revoke.status}: ` +
          `${JSON.stringify(revoke.body)}`
      );
    }
  });
});
