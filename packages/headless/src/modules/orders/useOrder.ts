import { computed, ref } from "vue";
import { createScopedComposable } from "../scope";
import { useSystem } from "../system";
import { rawOrderItems } from "./orders.mappers";
import createOrdersServices from "./orders.services";
import { hidesOneTimePurchases } from "./orders.utils";
import { createOrderActions } from "./useOrder.actions";
import { createOrderContext } from "./useOrder.context";
import { createOrderInternals } from "./useOrder.internals";
import { createOrderMeta } from "./useOrder.meta";
import { compact, map, uniq } from "lodash-es";
import type { OrderExtras } from "./orders.types";
import type { OrderManagerScopeMatrix } from "./orders.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IBillingCycle, IOrder } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module orders/useOrder
 * @description Scoped, query-backed read of ONE of a client's own placed
 * orders (a `new_contract` invoice): one TanStack item query per concrete
 * `(actor, id)` scope, minted once at construction. The order being read is
 * a RECORD ID (`.withId(id)`), never a scope context — there is no
 * actor-context cell to declare, so the matrix this passes as its `TMatrix`
 * refuses every actor (design 5.2, the `useClientReceivedEmail` precedent).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 2 — armless: no `.{actor}.ts` sibling exists at any
 * layer. One actor (`client`) resolves; no second actor has a member
 * exclusive to it or overriding the shared factory.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createOrderForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;
  const orderId = config.id as IOrder["id"] | undefined;

  /**
   * ONE services instance for this scope — the same factory
   * `useOrders.ts` calls, so both composables share one identity seam.
   */
  const service = createOrdersServices(actorScope, config.context);

  // Mint the item query ONCE per scope. `config.id` is the builder's own
  // `.withId(id)`, already folded into the scope key.
  const query = service.loadOne(orderId);

  // D-14 — reactive over the snapshot items, which resolve only once the
  // single read settles.
  const productIds = computed(() =>
    uniq(
      compact(map(rawOrderItems(query.data.value), item => item.product?.id))
    )
  );
  const imagesQuery = service.loadItemImages(productIds);

  // D-15, D-26 — reactive over the order's own `brand_id`.
  const brandId = computed(() => query.data.value?.brand_id);
  const gatewaysQuery = service.loadOnlineGateways(brandId);

  // D-25 — the manager holds its own resolved billing-cycle list; the
  // `system` query is lazy, so this is the ONE call that loads it here.
  // Not awaited: `isReady()` does not wait for it (D-25).
  const billingCycles = ref<IBillingCycle[]>([]);
  useSystem()
    .ensureBillingCycles()
    .then(cycles => {
      billingCycles.value = cycles;
    })
    .catch(() => {
      // Kept `[]`, no error surfaced — the billing cycle name is a label,
      // not the order (D-25).
    });

  // D-17 — the one-time-purchases gate (orders.utils, @decision there).
  const hideOneTimePurchases = computed(() => hidesOneTimePurchases());

  const extras: OrderExtras = {
    billingCycles,
    imageMap: imagesQuery.data,
    hasOnlineGateways: computed(() => gatewaysQuery.data.value > 0),
    hideOneTimePurchases,
    isProcessing: ref(false),
    stopGatewaysScope: gatewaysQuery.stop
  };

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createOrderActions(
    actorScope,
    service,
    query,
    scopeKey,
    orderId,
    extras
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for single-read actions (pay/cancel delegates, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for single-read context (the raw order + projections). */
    useContext: () => createOrderContext(actorScope, service, query, extras),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createOrderInternals(actorScope, query),

    /** Sub-composable for single-read meta (order conditions + state flags). */
    useMeta: () => createOrderMeta(actorScope, service, query, extras)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one of a client's own placed orders, read in full.
 *
 * @example
 * ```ts
 * const order = useOrder().as('self').withId(orderId)
 * const { data, detail, products } = order.useContext()
 * await order.useActions().isReady()
 * ```
 */
export const useOrder = createScopedComposable<
  ReturnType<typeof createOrderForScope>,
  OrderManagerScopeMatrix
>("orders", createOrderForScope);

// Type export for consumers
export type UseOrder = ReturnType<typeof useOrder>;
