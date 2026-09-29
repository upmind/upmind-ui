import type { ContractProductListQuery } from "./contract-product.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.internals
 * @description Collection internals (debugging). The query half exposes the
 * raw `query` object; the manager half exposes `send`/`state`/`service`.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createContractProductsInternals(
  actorScope: ScopeActorTypes,
  query: ContractProductListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

export type UseContractProductsInternals = ReturnType<
  typeof createContractProductsInternals
>;
