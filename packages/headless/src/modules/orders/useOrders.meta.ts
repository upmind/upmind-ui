import { computed } from "vue";
import { useBrand } from "../brand";
import { isMultibrand, showStore } from "./orders.mappers";
import { isEmpty, omit } from "lodash-es";
import type { OrdersListQuery, OrdersServices } from "./orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module orders/useOrders.meta
 * @description Collection meta — computed state flags, one computed per
 * flag, plus the store-CTA meta (D-16 — `showStore`/`storefrontUrl` are a
 * FRESH computation over `getConfigValue`/`uiCart`, not `useBrand`'s own
 * `hasStorefront`/`storefrontUrl`, which lose the external-store case).
 * @doctrine clause 2 — shared-only (armless).
 */
export function createOrdersMeta(
  _actorScope: ScopeActorTypes,
  service: OrdersServices,
  query: OrdersListQuery
) {
  const { uiCart } = useBrand();

  // Truthiness, not `isEmpty`: a TanStack error is an `Error` instance with
  // no own enumerable keys, which `isEmpty` reports as empty.
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyList = computed(
    () => isEmpty(query.data?.value) || query.pagination.value.total === 0
  );

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  /**
   * True while any filter OTHER than the forced `category.slug` leaf
   * applies — design 8.3 forces that leaf on every write, so the core
   * pass-through `query.isFiltered` is always true and cannot distinguish
   * an empty-because-filtered list from a genuinely empty one.
   */
  const isFiltered = computed(
    () => !isEmpty(omit(query.criteria.value.filters, "category.slug"))
  );

  /** D-16 — the storefront target, from the brand's own cart meta. */
  const storefrontUrl = computed(() => uiCart.value?.storefront_url);

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useOrders.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the list query failed. */
    hasError,

    /** True while there is a further page beyond the current one. */
    hasNextPage: computed(() => query.meta.value.hasNextPage),

    /** True while the list spans more than one page. */
    hasPages: computed(() => query.meta.value.hasPages),

    /** True while there is a page before the current one. */
    hasPrevPage: computed(() => query.meta.value.hasPrevPage),

    /**
     * True while this scope can address a client. Handed straight through
     * from the services instance: this IS the predicate the request gate
     * calls, not a second copy of it.
     */
    isAvailable: service.isAvailable,

    /** True if this scope has no orders. */
    isEmpty: isEmptyList,

    /** True while any filter other than the forced `category.slug` leaf applies. */
    isFiltered,

    /** True while the list is loading or has not completed its first fetch. */
    isLoading,

    /** D-16 — true while the organisation brand serves this scope. */
    isMultibrand: computed(isMultibrand),

    /** D-16 — true while the store CTA should render for this brand. */
    showStore: computed(showStore),

    /** D-16 — the store CTA's target url, when the brand configures one. */
    storefrontUrl

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers. Named `...Collection...` — `UseOrdersMeta`
// collides with the portal mock contract (`orders.types.ts` head `@decision`).
export type UseOrdersCollectionMeta = ReturnType<typeof createOrdersMeta>;
