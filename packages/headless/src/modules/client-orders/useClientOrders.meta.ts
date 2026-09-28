import { computed } from "vue";
import { useBrand } from "../brand";
import { isMultibrand, showStore } from "./client-orders.mappers";
import { isEmpty } from "lodash-es";
import type {
  ClientOrdersListQuery,
  ClientOrdersServices
} from "./client-orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrders.meta
 * @description Collection meta — computed state flags, one computed per
 * flag, plus the store-CTA meta (D-16 — `showStore`/`storefrontUrl` are a
 * FRESH computation over `getConfigValue`/`uiCart`, not `useBrand`'s own
 * `hasStorefront`/`storefrontUrl`, which lose the external-store case).
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientOrdersMeta(
  _actorScope: ScopeActorTypes,
  service: ClientOrdersServices,
  query: ClientOrdersListQuery
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

  /** D-16 — the storefront target, from the brand's own cart meta. */
  const storefrontUrl = computed(() => uiCart.value?.storefront_url);

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientOrders.meta.{actor}.ts` and spread it LAST.

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

// Type export for consumers. Named `...Collection...` — `UseClientOrdersMeta`
// collides with the portal mock contract (`client-orders.types.ts` head `@decision`).
export type UseClientOrdersCollectionMeta = ReturnType<
  typeof createClientOrdersMeta
>;
