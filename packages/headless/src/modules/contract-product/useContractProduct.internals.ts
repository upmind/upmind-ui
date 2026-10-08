import type { ContractProductInternalMembers } from "./contract-product.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.internals
 * @description Manager internals: the raw `send`, `state` and `service`, for
 * debugging.
 */
export function createContractProductInternals(
  actorScope: ScopeActorTypes,
  actor: UseActor
): ContractProductInternalMembers {
  return {
    /** Actor scope for this instance. */
    scopeActor: actorScope,
    /** Raw send function for machine events. */
    send: actor.send,
    /** Raw XState service. */
    service: actor.service,
    /** Raw XState state ref. */
    state: actor.state
  };
}

export type UseContractProductInternals = ReturnType<
  typeof createContractProductInternals
>;
