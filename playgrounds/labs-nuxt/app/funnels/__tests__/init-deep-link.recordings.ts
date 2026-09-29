// -----------------------------------------------------------------------------
/**
 * @module funnels/__tests__/init-deep-link.recordings
 * @description The recorded-body readers, the arriving-route builders and the
 * shared beat helpers the FE-3136 read-backs use. Server-free by design, so a
 * spec that proves a pure function (the auth-target carry, the scope push)
 * never boots a replay server it has no use for.
 *
 * ## The contract these read-backs honour
 * `tests/features/orders/init-deep-link.feature` — declarative and spec-only
 * per ADR-020. Its scenarios are honoured by the `component` specs beside this
 * file, not by an e2e runner.
 *
 * ## Provenance
 * Every body reached from here was captured by `pnpm fixtures:generate` into
 * the owning module's `__tests__/fixtures/`. Nothing is authored: the ids,
 * numbers, statuses and gateway providers a read-back asserts are read off the
 * recording.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { InitIntent } from "../labs.constants";
import { ROUTE } from "../types";
import { every, join as joinAll, map, reject, toPairs } from "lodash-es";
import type { RouteLocation } from "vue-router";

// -----------------------------------------------------------------------------

/** The recorded invoice cases this corpus can answer, by their fixture suffix. */
export type InvoiceCase =
  | "unpaid"
  | "paid"
  | "cancelled"
  | "not-found"
  | "signed-out";

// `import.meta.url` is an http URL under jsdom, so the root comes from the
// lane's own `root` (`vitest.config.ts`), which is this package.
const REPO_ROOT = join(process.cwd(), "..", "..");

const headlessModule = (name: string, ...rest: string[]): string =>
  join(REPO_ROOT, "packages", "headless", "src", "modules", name, ...rest);

export const recordingsDir = headlessModule(
  "invoices",
  "__tests__",
  "fixtures"
);

export const sessionRecordingsDir = headlessModule(
  "session-store",
  "__tests__",
  "fixtures"
);

export const ordersRecordingsDir = headlessModule(
  "orders",
  "__tests__",
  "fixtures"
);

export const brandRecordingsDir = headlessModule(
  "brand",
  "__tests__",
  "fixtures"
);

export const payableRecordingsDir = headlessModule(
  "payment-details",
  "__tests__",
  "fixtures"
);

const REQUIRED_CORPORA = [
  recordingsDir,
  sessionRecordingsDir,
  brandRecordingsDir,
  payableRecordingsDir
];

if (!every(REQUIRED_CORPORA, existsSync)) {
  throw new Error(
    `Recordings missing (${joinAll(reject(REQUIRED_CORPORA, existsSync), ", ")}). ` +
      "Run `pnpm fixtures:generate` from the repo root."
  );
}

// -----------------------------------------------------------------------------

/**
 * The ceiling on the pay guard's readiness wait, per design §6.1 property 5 —
 * the guard is awaited inside navigation-blocking middleware, so an invoice
 * that never loads is refused within this bound rather than leaving the app
 * with no page. `useInvoice().isReady()` now always settles, and may refuse
 * sooner than this ceiling.
 */
export const INTENT_READINESS_BOUND_MS = 30_000;

/** The ceiling for a beat that decides before the readiness bound is reached. */
export const BEAT_TIMEOUT = 20_000;

/** The ceiling for a beat that deliberately runs the readiness bound out. */
export const BOUND_BEAT_TIMEOUT = INTENT_READINESS_BOUND_MS + 15_000;

/** The window a beat gives a served read to reach the screen. */
export const SETTLE_MS = 10_000;

/** The window a beat gives the spent instruction to leave the address bar. */
export const SPENT_MS = 2_000;

/**
 * An opaque route token. There is no contracts module and no recorded product
 * in this tree (design §6.3), so the upgrade beats grade the param hop and the
 * placeholder surface, never a real product's eligibility.
 */
export const PRODUCT_ROUTE_TOKEN = "no-recorded-contract-product";

// -----------------------------------------------------------------------------

/** The invoice id the named recording was actually captured at. */
export function recordedInvoiceId(invoiceCase: InvoiceCase): string {
  const fixture = getFixture(`get-invoices-id-case-${invoiceCase}`, {
    recordingsDir
  });
  const id = /\/api\/invoices\/([0-9a-f-]{36})/.exec(fixture.request.path)?.[1];

  if (!id) {
    throw new Error(
      `The recorded "${invoiceCase}" invoice carries no invoice id. ` +
        "Re-run `pnpm fixtures:generate invoices`."
    );
  }
  return id;
}

/** The named recording's own body, as captured. */
export function recordedInvoice<T = Record<string, unknown>>(
  invoiceCase: InvoiceCase
): T {
  return getFixtureBody<{ data: T }>(`get-invoices-id-case-${invoiceCase}`, {
    recordingsDir
  }).data;
}

export const RECORDED_GATEWAY_LIST =
  "get-brands-id-gateways-active-1-case-pay-client-id-country-id";

/** The brand id the recorded gateway list was actually captured under. */
export function recordedBrandId(): string {
  const fixture = getFixture(RECORDED_GATEWAY_LIST, {
    recordingsDir: payableRecordingsDir
  });
  const id = /\/api\/brands\/([0-9a-f-]{36})\/gateways/.exec(
    fixture.request.path
  )?.[1];

  if (!id) {
    throw new Error(
      "The recorded gateway list carries no brand id. " +
        "Re-run `pnpm fixtures:generate payment-details`."
    );
  }
  return id;
}

/** The gateway providers the recorded list actually carries. */
export function recordedGatewayProviders(): string[] {
  const body = getFixtureBody<{ data: { gateway: { provider: string } }[] }>(
    RECORDED_GATEWAY_LIST,
    { recordingsDir: payableRecordingsDir }
  );
  return map(body.data, entry => entry.gateway.provider);
}

// -----------------------------------------------------------------------------

/**
 * Builds the route object the funnel is handed, without touching the document —
 * for a beat that grades a pure function over an arriving route.
 */
export function routeFor(
  name: string,
  options: { params?: Record<string, string>; query?: Record<string, string> }
): RouteLocation {
  const params = options.params ?? {};
  const query = options.query ?? {};
  const path = `/${name}${joinAll(
    map(toPairs(params), ([, value]) => `/${value}`),
    ""
  )}`;
  const search = new URLSearchParams(query).toString();
  const fullPath = search ? `${path}?${search}` : path;

  return {
    name,
    path,
    fullPath,
    params,
    query,
    hash: "",
    matched: [],
    meta: {},
    redirectedFrom: undefined
  } as unknown as RouteLocation;
}

/**
 * Builds the route object AND moves the window to the same url — the param
 * clear writes through `window.location`, so a bench whose window sits
 * elsewhere grades a url the app never had.
 */
export function arriveAt(
  name: string,
  options: { params?: Record<string, string>; query?: Record<string, string> }
): RouteLocation {
  const route = routeFor(name, options);

  window.history.replaceState({}, "", route.fullPath);
  window.dispatchEvent(new window.PopStateEvent("popstate"));

  return route;
}

/** A pay deep link arriving at the order page for `invoiceId`. */
export function payLinkTo(
  invoiceId: string,
  intent: string = InitIntent.PAY
): RouteLocation {
  return arriveAt(ROUTE.ORDER, {
    params: { [QUERY_PARAMS.ORDER_ID]: invoiceId },
    query: { [QUERY_PARAMS.INIT]: intent }
  });
}

/** An upgrade deep link arriving at the product page for {@link PRODUCT_ROUTE_TOKEN}. */
export function upgradeLink(
  intent: string = InitIntent.UPGRADE
): RouteLocation {
  return arriveAt(ROUTE.CONTRACT_PRODUCT, {
    params: { [QUERY_PARAMS.PRODUCT_ID]: PRODUCT_ROUTE_TOKEN },
    query: { [QUERY_PARAMS.INIT]: intent }
  });
}

// -----------------------------------------------------------------------------

/** The `init` value the url is actually carrying, or `undefined` once spent. */
export function initParamInUrl(): string | undefined {
  return (
    new URLSearchParams(window.location.search).get(QUERY_PARAMS.INIT) ??
    undefined
  );
}

/** Waits, within a stated window, for the instruction to leave the address bar. */
export function expectInstructionSpent(): Promise<void> {
  return vi.waitFor(() => expect(initParamInUrl()).toBeUndefined(), {
    timeout: SPENT_MS
  });
}
