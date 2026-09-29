import { computed } from "vue";
import { mapOrderDetail, mapOrderItems } from "./client-orders.mappers";
import { mapToHeadlessError } from "../../utils";
import type {
  ClientOrderExtras,
  ClientOrderItemQuery,
  ClientOrdersServices
} from "./client-orders.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrder.context
 * @description Manager context — the raw order (D-2), its detail and item
 * projections (design 8.7), the contract id and the captured error.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientOrderContext(
  _actorScope: ScopeActorTypes,
  service: ClientOrdersServices,
  query: ClientOrderItemQuery,
  extras: ClientOrderExtras
) {
  const error = computed<ResponseError | undefined>(
    () =>
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  const detail = computed(() => mapOrderDetail(query.data.value));

  const products = computed(() =>
    mapOrderItems(query.data.value, {
      billingCycles: extras.billingCycles.value,
      imageMap: extras.imageMap.value,
      hideOneTimePurchases: extras.hideOneTimePurchases.value
    })
  );

  const contractId = computed(() => query.data.value?.contract_id);

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useClientOrder.context.{actor}.ts` and spread it LAST.

  return {
    /** The raw order this scope resolved (D-2). */
    data: query.data,

    /** The contract id of this order — `cancel()`'s port argument (D-13). */
    contractId,

    /** The detail projection (design 8.7). */
    detail,

    /** The scope's captured error — read, never raised. */
    error,

    /** The item projection (design 8.7). */
    products

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientOrderManagerContext = ReturnType<
  typeof createClientOrderContext
>;
