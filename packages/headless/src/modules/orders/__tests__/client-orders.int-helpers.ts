// -----------------------------------------------------------------------------
/**
 * @module client-orders/__tests__/client-orders.int-helpers
 * @description Integration scaffolding for the client-orders `*.int.test.ts`
 * files, layered on the shared `criteria-int-kit`. It loads the design 8.8
 * captures by name and serves them by their recorded request: a request that
 * no capture of the pool records exactly is a network error, never a
 * fallback body. Every body it serves is a recorded capture of this module
 * or of the `brand` module. A declared design 8.8 construction is built in
 * the spec that names it, never here.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import { useClientOrders } from "..";
import {
  installBootstrapStubs,
  observeRequests,
  seedClientSession as seedClientSessionKit
} from "../../../__tests__/criteria-int-kit";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  LIST_CAPTURES,
  capture,
  captured,
  recordedParams
} from "./client-orders.captures";
import { server } from "./setup.integration";
import { isEqual, sortBy } from "lodash-es";
import type { ClientOrdersFilterModel, ClientOrdersQueryModel } from "..";
import type { Envelope } from "../../../__tests__/criteria-int-kit";
import type { Fixture } from "@upmind-automation/test-fixtures";
import type { HttpHandler } from "msw";

export {
  ALL_CAPTURES,
  LIST_CAPTURES,
  ORDER_CAPTURES,
  PROBED_COMPARISONS,
  capture,
  captured,
  probeName,
  recordedParams
} from "./client-orders.captures";

export type {
  Envelope,
  ObservedRequest
} from "../../../__tests__/criteria-int-kit";

/** A recorded single-read envelope. */
export type OrderEnvelope = Envelope<Record<string, unknown>>;

/** A recorded list envelope. */
export type ListEnvelope = Envelope<Array<Record<string, unknown>>>;

export const brandRecordingsDir = join(
  import.meta.dirname,
  "../../brand/__tests__/fixtures"
);

// -----------------------------------------------------------------------------

/** The recorded single-read envelope of one design 8.8 capture. */
export function capturedOrder(name: string): OrderEnvelope {
  return captured<OrderEnvelope>(name);
}

/** The literal value staging received for `paramKey` in the capture `name`. */
export function recordedParam(name: string, paramKey: string): string {
  const value = recordedParams(name).get(paramKey);
  if (value === null) {
    throw new Error(
      `[client-orders int-helpers] capture "${name}" carries no "${paramKey}" param.`
    );
  }
  return value;
}

/** A `{ filters: { [field]: leaf } }` patch, checked against the published model. */
export function filterPatch<K extends keyof ClientOrdersFilterModel>(
  field: K,
  leaf: NonNullable<ClientOrdersFilterModel[K]>
): Pick<ClientOrdersQueryModel, "filters"> {
  return {
    filters: { [field]: leaf } as Pick<ClientOrdersFilterModel, K>
  };
}

// -----------------------------------------------------------------------------

const CSV_SET_PARAMS = new Set(["with", "with_count"]);
const IGNORED_PARAMS = new Set(["case", "lang", "currency_code"]);

/** A request's criteria, less `case` and the locale params; the relation lists compare as sets. */
function criteriaOf(params: URLSearchParams): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const [key, value] of params.entries()) {
    if (IGNORED_PARAMS.has(key)) continue;
    entries.push([
      key,
      CSV_SET_PARAMS.has(key) ? sortBy(value.split(",")).join(",") : value
    ]);
  }
  return sortBy(entries, ([key, value]) => `${key}=${value}`);
}

/** The capture of `names` whose recorded request equals `request`, if any. */
export function recordedMatch(
  names: readonly string[],
  request: Request
): Fixture | undefined {
  const url = new URL(request.url);
  const wanted = criteriaOf(url.searchParams);
  for (const name of names) {
    const fixture = capture(name);
    const recorded = new URL(fixture.request.path, "http://x");
    if (recorded.pathname !== url.pathname) continue;
    if (isEqual(criteriaOf(recorded.searchParams), wanted)) return fixture;
  }
  return undefined;
}

/** A handler that answers each request with the capture that records it. */
function recordedHandler(route: string, names: readonly string[]): HttpHandler {
  return http.get(route, ({ request }) => {
    const fixture = recordedMatch(names, request);
    if (!fixture) {
      console.error(`[client-orders] no capture records ${request.url}`);
      return HttpResponse.error();
    }
    return HttpResponse.json(fixture.response.body as object, {
      status: fixture.response.status
    });
  });
}

/** Serves `api/invoices` from the list captures, each on its own recorded request. */
export function serveRecordedLists(
  names: readonly string[] = LIST_CAPTURES
): void {
  server?.use(recordedHandler("*/api/invoices", names));
}

/**
 * Serves one single-read envelope on `api/invoices/{its id}`, the recorded
 * item-image read on `api/products`, and the recorded online-gateway read on
 * `api/brands/{id}/gateways`, each only for its own recorded request.
 */
export function serveRecordedOrder(envelope: OrderEnvelope): void {
  const id = envelope.data.id as string;
  server?.use(
    http.get("*/api/invoices/:id", ({ params }) =>
      params.id === id ? HttpResponse.json(envelope) : HttpResponse.error()
    ),
    recordedHandler("*/api/products", ["get-products-case-order-images"]),
    recordedHandler("*/api/brands/:brandId/gateways", [
      "get-brands-id-gateways-case-online"
    ])
  );
}

// -----------------------------------------------------------------------------

/**
 * The bootstrap reads `useBrand()` and the `system` module fire, each served
 * with the `brand` module's recorded capture, or with this module's recorded
 * billing cycles. A spec that needs another brand state overrides one route.
 */
export function installClientOrdersBackgroundStubs(): void {
  const brand = (name: string) =>
    getFixture(name, { recordingsDir: brandRecordingsDir }).response
      .body as object;

  server?.use(
    http.get("*/brand/settings", () =>
      HttpResponse.json(brand("get-brand-settings"))
    ),
    http.get("*/config/brand/values", () =>
      HttpResponse.json(brand("get-config-brand-values"))
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json(brand("get-config-organisation-values"))
    ),
    http.get("*/org/modules", () =>
      HttpResponse.json(brand("get-org-modules"))
    ),
    http.get("*/billing_cycles", () =>
      HttpResponse.json(captured("get-billing-cycles-case-order-items"))
    )
  );
}

/** The recorded brand settings envelope of the `brand` module. */
export type BrandSettingsEnvelope = {
  data: {
    id: string;
    meta: { cart: Record<string, unknown> } & Record<string, unknown>;
  } & Record<string, unknown>;
} & Record<string, unknown>;

/** A deep copy of the recorded brand settings envelope. */
export function recordedBrandSettings(): BrandSettingsEnvelope {
  return structuredClone(
    getFixture("get-brand-settings", { recordingsDir: brandRecordingsDir })
      .response.body
  ) as BrandSettingsEnvelope;
}

/** A deep copy of the recorded brand config values envelope. */
export function recordedBrandConfig(): {
  data: Record<string, unknown>;
} & Record<string, unknown> {
  return structuredClone(
    getFixture("get-config-brand-values", { recordingsDir: brandRecordingsDir })
      .response.body
  ) as { data: Record<string, unknown> } & Record<string, unknown>;
}

/** Every live scope key this module holds in the registry. */
export function clientOrderScopeKeys(): string[] {
  return [...getRegistry().keys()].filter(key =>
    key.startsWith("client-orders")
  );
}

/** Evicts every client-orders scope entry and clears the shared query cache. */
export function resetClientOrderScopes(): void {
  for (const key of clientOrderScopeKeys()) remove(key);
  queryClient.clear();
}

/**
 * Seeds a real authenticated client session, the recorded brand reads and
 * the recorded list pool. `brandHandlers` go on top of the recorded brand
 * reads, for a spec that names one design 8.8 brand state. Returns the
 * resolved client id.
 */
export async function seedClientSession(
  brandHandlers: HttpHandler[] = []
): Promise<{
  clientId: string;
  accessToken: string;
}> {
  resetClientOrderScopes();
  installClientOrdersBackgroundStubs();
  serveRecordedLists();
  server?.use(...brandHandlers);
  return seedClientSessionKit(server, { withBrandConfig: false });
}

/**
 * Boots `useClientOrders().as('self')` on one design 8.8 brand state: the
 * recorded brand config and settings, each changed by its transform. Returns
 * the settled collection meta.
 */
export async function bootCollectionOnBrand(state: {
  config?: (data: Record<string, unknown>) => Record<string, unknown>;
  cart?: (cart: Record<string, unknown>) => Record<string, unknown>;
}) {
  const config = recordedBrandConfig();
  const settings = recordedBrandSettings();
  await seedClientSession([
    http.get("*/config/brand/values", () =>
      HttpResponse.json({
        ...config,
        data: state.config ? state.config(config.data) : config.data
      })
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({
        ...settings,
        data: {
          ...settings.data,
          meta: {
            ...settings.data.meta,
            cart: state.cart
              ? state.cart(settings.data.meta.cart)
              : settings.data.meta.cart
          }
        }
      })
    )
  ]);
  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders.useMeta();
}

/** Passively observes every request whose URL contains `/invoices`. */
export function observeOrderRequests(): ReturnType<typeof observeRequests> {
  return observeRequests(server, "/invoices");
}

/** Passively observes every request this module can send. */
export function observeModuleRequests(): ReturnType<typeof observeRequests> {
  return observeRequests(server, "upmind");
}

/** Lets a would-be request or refetch leave before an absence is asserted. */
export const settle = (ms = 150): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export { installBootstrapStubs };
