// -----------------------------------------------------------------------------
/**
 * @module portal/mock/injection
 * @description The provide/inject channel carrying the active shape's mock
 * dataset to `PortalSlotContent` (the data-ref seam). Provided by the owners
 * of `usePortalConfig` — the layout and the page host — never sniffed from
 * Nuxt globals inside the shell: a `typeof useRoute` guard reads "undefined"
 * in the real build (the auto-import is only injected for a CALL), which
 * silently starved every data ref and crashed the list module in the browser
 * while jsdom, with its global stubs, stayed green.
 */

import { computed, inject, provide } from "vue";
import { isMockDatasetId, useMockData } from "./store";
import type { MockDataset } from "./types";
import type { ComputedRef, InjectionKey } from "vue";
import { usePortalConfig } from "~/composables/usePortalConfig";

export const ACTIVE_MOCK_DATA: InjectionKey<
  ComputedRef<MockDataset | undefined>
> = Symbol("active-mock-data");

/**
 * Called in a setup that owns the route (layout, page host): provides the
 * ACTIVE DATASET, which is its own axis now (plan R9) — the shape decides the
 * arrangement, the dataset decides which side of every brand gate renders.
 */
export function provideActiveMockData(): void {
  const { activeDatasetId } = usePortalConfig();
  provide(
    ACTIVE_MOCK_DATA,
    computed(() => {
      const id = activeDatasetId.value;
      if (!isMockDatasetId(id)) return undefined;
      return useMockData(id);
    })
  );
}

/** The slot renderer's side: absent provider (a bare unit mount) reads as "no dataset", so literal props keep working. */
export function injectActiveMockData(): ComputedRef<MockDataset | undefined> {
  return inject(
    ACTIVE_MOCK_DATA,
    computed(() => undefined)
  );
}

/** The route position the data-ref selectors may key off — which group, product, or action area the page names. */
export type DataRouteContext = {
  readonly groupSlug?: string;
  readonly productId?: string;
  readonly area?: string;
  /** A detail page's own entity — the invoice, order, or credit note the route names. */
  readonly entityId?: string;
  /** Which pillar the route belongs to — the contextual side menu's axis (routes.ts `pillarForPath`). */
  readonly pillar?: string;
  /** The listing's own filters, from the route's query — legacy's type route-groups and category routes. */
  readonly productType?: string;
  readonly category?: string;
  /** The status tab showing — legacy's All/Active/Cancelled routes, as query state on one route. */
  readonly status?: string;
  /** The order just placed — legacy's order-complete state, as query on the listing it lands back on. */
  readonly orderComplete?: string;
  /** The address the login screen carried across to password recovery (plan F11). */
  readonly username?: string;
  /** The link's own token, where a screen is reached by one rather than by a session. */
  readonly token?: string;
  /** The address a link is about — the email opt-in screen's `?email=`. */
  readonly email?: string;
  /**
   * How many pages of a THREAD have been asked for — the ticket feed's own
   * Show-more, which legacy fetched a page at a time
   * (`ticketMessages.vue:105-112`). Absent reads as the first page.
   */
  readonly page?: string;
};

/**
 * The context members the route carries in its PATH — a resolution supplies
 * these, never a query string. Every other member is query-borne, and
 * `ROUTE_QUERY_KEY` below must name one for each: adding a member to
 * `DataRouteContext` without deciding which of the two it is stops the build,
 * which is the point (the `?page=` member was declared, read by the thread
 * selectors, and threaded by nobody for a whole phase).
 */
type RoutePositionMember = Extract<
  keyof DataRouteContext,
  "groupSlug" | "productId" | "area" | "entityId" | "pillar"
>;

type RouteQueryMember = Exclude<keyof DataRouteContext, RoutePositionMember>;

/** Which query key each query-borne member reads. */
export const ROUTE_QUERY_KEY: Readonly<Record<RouteQueryMember, string>> = {
  productType: "type",
  category: "category",
  status: "status",
  orderComplete: "orderComplete",
  username: "username",
  token: "token",
  email: "email",
  page: "page"
};

/**
 * The PRODUCT a page was reached about (`?product=`) — the one position
 * member a query may also supply, which a route naming a product in its path
 * still wins over (the page host merges its own context last).
 */
export const ROUTE_PRODUCT_QUERY_KEY = "product";

/** One query value, where the route carries exactly one — a repeated key names no single thing. */
export function routeQueryValue(
  query: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const value = query?.[key];
  if (typeof value !== "string") return undefined;
  // `?token=` with nothing after it names nothing: an empty value is the key
  // being absent, which is what every reader of these members expects.
  if (value === "") return undefined;
  return value;
}

/**
 * Every query-borne member of the context, read off one route's query. The
 * members are ITERATED from `ROUTE_QUERY_KEY` rather than listed here, so a
 * member the type declares cannot be left unthreaded.
 */
export function routeQueryContext(
  query: Record<string, unknown> | undefined
): DataRouteContext {
  const context: Record<string, string> = {};
  for (const [member, key] of Object.entries(ROUTE_QUERY_KEY)) {
    const value = routeQueryValue(query, key);
    if (value !== undefined) context[member] = value;
  }
  return context;
}

export const ACTIVE_ROUTE_CONTEXT: InjectionKey<ComputedRef<DataRouteContext>> =
  Symbol("active-route-context");

/** Provided by the page host from its own props — the catch-all page computes it from its resolution. */
export function provideRouteContext(
  context: ComputedRef<DataRouteContext>
): void {
  provide(ACTIVE_ROUTE_CONTEXT, context);
}

/** Absent provider (a bare unit mount, a named pillar page) reads as an empty context. */
export function injectRouteContext(): ComputedRef<DataRouteContext> {
  return inject(
    ACTIVE_ROUTE_CONTEXT,
    computed(() => ({}))
  );
}
