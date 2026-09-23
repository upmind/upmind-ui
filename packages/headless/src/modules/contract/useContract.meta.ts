import { computed } from "vue";
import { ContractState } from "./contract.types";
import { contextValue, stateMatches, useStateMatches } from "../../utils";
import { isNil } from "lodash-es";
import type { ContractContext } from "./contract.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContract.meta
 * @description Manager meta — FLAT boolean computeds, one per flag (R23): the
 * eight node flags of flow.md section 3, plus the lifecycle flags.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const hasError = computed(
    () => !isNil(contextValue<ContractContext["error"]>(state, "error"))
  );

  return {
    /** True if the machine captured an error. */
    hasError,

    /** True once the contract sits in an `available` node. */
    isAvailable: useStateMatches(state, "available"),

    /** True while the machine is waiting for the session or reading the contract; false once a read has failed. */
    isLoading: computed(
      () => stateMatches(state, ["subscribing", "loading"]) && !hasError.value
    ),

    /** True while the payment-method write is being processed, from either parent. */
    isSubmitting: useStateMatches(state, [
      "available.changingPaymentMethod.processing",
      "unavailable.changingPaymentMethod.processing"
    ]),

    /** True while the payment-method form is open, from either parent. */
    isPaymentMethodOpen: useStateMatches(state, [
      "available.changingPaymentMethod.available",
      "available.changingPaymentMethod.processing",
      "unavailable.changingPaymentMethod.available",
      "unavailable.changingPaymentMethod.processing"
    ]),

    /** True when the open payment-method form passes validation, from either parent. */
    isPaymentMethodValid: useStateMatches(state, [
      "available.changingPaymentMethod.available.valid",
      "unavailable.changingPaymentMethod.available.valid"
    ]),

    /** True in `available.status.pending`. */
    isPending: useStateMatches(state, ContractState.PENDING),

    /** True in `available.status.inactive` (awaiting activation). */
    isInactive: useStateMatches(state, ContractState.INACTIVE),

    /** True in `available.status.active`. */
    isActive: useStateMatches(state, ContractState.ACTIVE),

    /** True in `available.status.suspended`. */
    isSuspended: useStateMatches(state, ContractState.SUSPENDED),

    /** True in `available.status.cancelling` (a hard cancellation request exists). */
    isCancelling: useStateMatches(state, ContractState.CANCELLING),

    /** True in `unavailable.status.cancelled`. */
    isCancelled: useStateMatches(state, ContractState.CANCELLED),

    /** True in `unavailable.status.lapsed`. */
    isLapsed: useStateMatches(state, ContractState.LAPSED),

    /** True in `unavailable.status.fraud`. */
    isFraud: useStateMatches(state, ContractState.FRAUD)
  };
}

export type UseContractMeta = ReturnType<typeof createContractMeta>;
