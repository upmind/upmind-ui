// -----------------------------------------------------------------------------
/**
 * @module client-orders/__tests__/client-orders.int-helpers
 * @description Module-specific integration scaffolding for client-orders'
 * `*.int.test.ts` files, layered on the shared `criteria-int-kit` (session
 * seeding, request observation, the Upmind envelope type — none re-declared
 * here, per `hooks/graphify-gate.sh` U12): evict this module's scope-registry
 * entries between tests, expose the RECORDED wire bodies every handler
 * serves, and install the brand-settled stub this module's `enabled` gate
 * needs (design.md 6.1 step 6 — an EMPTY brand settle rejects with
 * `NotAuthenticatedError` and the list never fires).
 *
 * Every response body served here comes from a fixture captured by
 * `pnpm fixtures:generate client-orders` against real staging, or from the
 * `brand` module's own already-recorded `get-brand-settings` capture (reused
 * as-is, never re-authored) — no test in this module builds a wire body of
 * its own.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  installBootstrapStubs,
  observeRequests,
  seedClientSession as seedClientSessionKit
} from "../../../__tests__/criteria-int-kit";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import { server, recordingsDir } from "./setup.integration";
import type { Envelope } from "../../../__tests__/criteria-int-kit";
import type { ClientOrdersFilterModel, ClientOrdersQueryModel } from "..";

export type {
  Envelope,
  ObservedRequest
} from "../../../__tests__/criteria-int-kit";

// -----------------------------------------------------------------------------

/**
 * The recorded bodies, by capture — every file `client-orders.fixtures.ts`
 * wrote from real staging. This pass's capture window carried NO
 * `invoice_unpaid`/`invoice_overdue`/`invoice_refunded` row in the real
 * `new_contract` history (see that generator's own disclosure log at capture
 * time) — only `invoice_paid` and `invoice_cancelled` single-order captures
 * exist. A test that needs a state absent from the real corpus escalates
 * rather than constructs one (design 8.8's recording rule).
 */
export const recorded = {
  /** `GET api/invoices` broad real list, forced category, `with=status,products`. */
  list: () =>
    getFixtureBody<Envelope<unknown[]>>("case-orders-default", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[status.code|eq]=...` — real 200 (AC9, ruling 4). */
  statusEq: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-status-code-eq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[status.code|neq]=...` — real 200 (AC9, ruling 4). */
  statusNeq: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-status-code-neq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.product.name|like]=...` — real 200 (AC7, ruling 4). */
  productNameLike: () =>
    getFixtureBody<Envelope<unknown[]>>("products-product-name-like", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.product.name|eq]=...` — real 200 (AC7, ruling 4). */
  productNameEq: () =>
    getFixtureBody<Envelope<unknown[]>>("products-product-name-eq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.product.name|neq]=...` — real 200 (AC7, ruling 4). */
  productNameNeq: () =>
    getFixtureBody<Envelope<unknown[]>>("products-product-name-neq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.product.category.name|like]=...` — real 200 (AC7, ruling 4). */
  categoryNameLike: () =>
    getFixtureBody<Envelope<unknown[]>>("product-category-name-like", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.product.category.name|eq]=...` — real 200 (AC7, ruling 4). */
  categoryNameEq: () =>
    getFixtureBody<Envelope<unknown[]>>("product-category-name-eq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.product.category.name|neq]=...` — real 200 (AC7, ruling 4). */
  categoryNameNeq: () =>
    getFixtureBody<Envelope<unknown[]>>("product-category-name-neq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.service_identifier|like]=...` — real 200 (AC7, ruling 4). */
  serviceIdentifierLike: () =>
    getFixtureBody<Envelope<unknown[]>>("service-identifier-like", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.service_identifier|eq]=...` — real 200 (AC7, ruling 4). */
  serviceIdentifierEq: () =>
    getFixtureBody<Envelope<unknown[]>>("service-identifier-eq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[products.service_identifier|neq]=...` — real 200 (AC7, ruling 4). */
  serviceIdentifierNeq: () =>
    getFixtureBody<Envelope<unknown[]>>("service-identifier-neq", {
      recordingsDir
    }),
  /** `GET api/invoices/{id}` — a real PAID order (design 8.5 truth table, T10). */
  orderPaid: () =>
    getFixtureBody<Envelope<Record<string, unknown>>>("id-case-order-paid", {
      recordingsDir
    }).data,
  /** `GET api/invoices/{id}` — a real CANCELLED order (design 8.5 truth table, T10). */
  orderCancelled: () =>
    getFixtureBody<Envelope<Record<string, unknown>>>(
      "id-case-order-cancelled",
      { recordingsDir }
    ).data,
  /** `GET api/invoices?filter[number|eq]=...` — real 200 (AC7, ruling 3). */
  numberEq: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-number-eq", { recordingsDir }),
  /** `GET api/invoices?filter[number|like]=...` — real 200 (AC7, ruling 3). */
  numberLike: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-number-like", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[number|neq]=...` — real 200 (AC7, ruling 3). */
  numberNeq: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-number-neq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[total_amount|eq]=10` — real 200 (AC7, ruling 3). */
  totalAmountEq: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-total-amount-eq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[total_amount|neq]=10` — real 200 (AC7, ruling 3). */
  totalAmountNeq: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-total-amount-neq", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[total_amount|gt]=10` — real 200 (AC7, ruling 3). */
  totalAmountGt: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-total-amount-gt", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[total_amount|gte]=10` — real 200 (AC7, ruling 3). */
  totalAmountGte: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-total-amount-gte", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[total_amount|lt]=10` — real 200 (AC7, ruling 3). */
  totalAmountLt: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-total-amount-lt", {
      recordingsDir
    }),
  /** `GET api/invoices?filter[total_amount|lte]=10` — real 200 (AC7, ruling 3). */
  totalAmountLte: () =>
    getFixtureBody<Envelope<unknown[]>>("filter-total-amount-lte", {
      recordingsDir
    })
};

// -----------------------------------------------------------------------------

/**
 * Builds a `{ filters: { [field]: leaf } }` criteria patch that type-checks
 * against the real published `ClientOrdersFilterModel` for whichever `field`
 * the caller names — no `as never` at the call site. TypeScript cannot widen
 * a computed-key object literal against a generic `K` without one narrow,
 * targeted assertion inside this single helper (a known mapped-type
 * limitation); every call site stays fully checked, because `field` and
 * `leaf` must still agree with `K`.
 */
export function filterPatch<K extends keyof ClientOrdersFilterModel>(
  field: K,
  leaf: NonNullable<ClientOrdersFilterModel[K]>
): Pick<ClientOrdersQueryModel, "filters"> {
  return {
    filters: { [field]: leaf } as Pick<ClientOrdersFilterModel, K>
  };
}

// -----------------------------------------------------------------------------

/**
 * Serves `api/invoices` (collection) from the RECORDED default-list body.
 * Overridable per test (`setListBody`) so a test can point the collection at
 * a different real capture without hand-building a response from scratch.
 */
export function installClientOrdersHandlers(): {
  setListBody: (body: Envelope<unknown[]>) => void;
  setOneBody: (body: Envelope<Record<string, unknown>>) => void;
} {
  let listBody = recorded.list();
  let oneBody: Envelope<Record<string, unknown>> = {
    status: "ok",
    data: recorded.orderPaid(),
    total: null,
    error: null,
    messages: null,
    meta: null
  };

  server?.use(
    http.get("*/invoices/:id", () => HttpResponse.json(oneBody)),
    http.get("*/invoices", () => HttpResponse.json(listBody))
  );

  return {
    setListBody: (body: Envelope<unknown[]>) => {
      listBody = body;
    },
    setOneBody: (body: Envelope<Record<string, unknown>>) => {
      oneBody = body;
    }
  };
}

/**
 * Background bootstrap calls unrelated to any client-orders AC (brand
 * settling, billing-cycle reference data) fire as a side effect of
 * `useBrand()`'s own settling watch. Re-applied on every seed — the replay
 * server resets handlers between tests.
 *
 * `GET .../brand/settings` MUST resolve a real, non-empty `data.id` — design 6.1
 * step 6: an empty brand settle rejects the guard with `NotAuthenticatedError`
 * and the list never fires. So this reuses the `brand` module's own already
 * -recorded `get-brand-settings` capture (real staging data), never a
 * hand-authored `{}` stand-in.
 */
export function installClientOrdersBackgroundStubs(): void {
  const brandRecordingsDir = join(
    import.meta.dirname,
    "../../brand/__tests__/fixtures"
  );
  const brandSettingsBody = getFixtureBody<Record<string, unknown>>(
    "get-brand-settings",
    { recordingsDir: brandRecordingsDir }
  );

  server?.use(
    http.get("*/config/brand/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/brand/settings", () => HttpResponse.json(brandSettingsBody)),
    http.get("*/billing_cycles", () =>
      HttpResponse.json({ status: "ok", data: [] })
    )
  );
}

// -----------------------------------------------------------------------------

/** Every live scope key this module currently holds in the registry. */
export function clientOrderScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith("client-orders")
  );
}

/**
 * Evict every client-orders scope entry so each test starts from a fresh
 * instance against ITS OWN handlers. The registry entry and the TanStack
 * query cache are separate lifetimes — dropping the entry alone leaves a new
 * instance free to serve the PREVIOUS test's cached data, so the shared cache
 * is cleared too.
 */
export function resetClientOrderScopes(): void {
  for (const key of clientOrderScopeKeys()) remove(key);
  queryClient.clear();
}

/**
 * Seeds a real authenticated client session AND this module's brand-settled
 * stub (never the kit's generic empty `{ data: {} }` brand default — see
 * `installClientOrdersBackgroundStubs`'s doc). Returns the resolved client id.
 */
export async function seedClientSession(): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientOrderScopes();
  installClientOrdersBackgroundStubs();
  return seedClientSessionKit(server, { withBrandConfig: false });
}

/** Passively observes every request whose URL contains `/invoices`. */
export function observeOrderRequests(): ReturnType<typeof observeRequests> {
  return observeRequests(server, "/invoices");
}

export { installBootstrapStubs };
