import type {
  ContractProductListQuery,
  ContractProductsInternalMembers
} from "./contract-product.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts.internals
 * @description Collection internals: the raw list query, for debugging.
 */

export function createContractProductsInternals(
  actorScope: ScopeActorTypes,
  query: ContractProductListQuery
): ContractProductsInternalMembers {
  return {
    /** Raw TanStack query object backing the collection. */
    query,
    /** Actor scope for this instance. */
    scopeActor: actorScope
  };
}

export type UseContractProductsInternals = ReturnType<
  typeof createContractProductsInternals
>;
