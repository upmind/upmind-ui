import { computed } from "vue";
import { ContractStatusCodes } from "@upmind-automation/types";
import { ContractProductState } from "./contract-product.types";
import {
  anniversaryAnchor,
  hasHardCancellationRequest,
  isCancellable,
  isDue
} from "./contract-product.utils";
import { contextValue, useContext, useStateMatches } from "../../utils";
import { isUndefined, some } from "lodash-es";
import type { ContractProduct, UnpaidInvoice } from "./contract-product.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.meta
 * @description Manager meta — flags only (R23): the thirteen reportable node
 * flags of flow.md §3 read with `useStateMatches`, and the record facts of
 * design 8.7 read off the view model with lodash paths.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractProductMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const contractProduct = useContext<ContractProduct>(state, "contractProduct");

  const isCancelling = useStateMatches(state, ContractProductState.CANCELLING);

  const isPending = useStateMatches(state, ContractProductState.PENDING);

  const hasScheduledFutureCancellation = computed(
    () =>
      !!contextValue<boolean>(
        state,
        "contractProduct.hasScheduledFutureCancellation"
      )
  );

  const unpaidRecurringInvoices = computed<UnpaidInvoice[]>(
    () =>
      contextValue<UnpaidInvoice[]>(
        state,
        "contractProduct.unpaidRecurringInvoices"
      ) ?? []
  );

  return {
    /** True if the platform reports the product as cancellable. */
    canCancel: computed(
      () => !!contextValue<boolean>(state, "contractProduct.canCancel")
    ),

    /**
     * True when the client may open a cancellation REQUEST (HARD): no hard
     * request already pending (a pending contract is allowed). Derived from the
     * record; the brand setting `SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION` is
     * NOT read (design 8.3 — the module reads no brand setting).
     */
    canRequestCancellation: computed(
      () =>
        !!contractProduct.value &&
        !hasHardCancellationRequest(contractProduct.value) &&
        !hasScheduledFutureCancellation.value
    ),

    /**
     * True when the client may cancel at END OF TERM (SOFT): no hard request
     * pending, and the contract is not pending. Derived from the record.
     */
    canRequestEndOfTerm: computed(
      () =>
        !!contractProduct.value &&
        !hasHardCancellationRequest(contractProduct.value) &&
        !hasScheduledFutureCancellation.value &&
        contractProduct.value.contractStatus !== ContractStatusCodes.PENDING
    ),

    /** True when a future cancellation can be booked: not cancelling, not pending, none booked, and an anniversary exists. */
    canScheduleFutureCancellation: computed(
      () =>
        !!contractProduct.value &&
        !isCancelling.value &&
        !isPending.value &&
        !hasScheduledFutureCancellation.value &&
        !!anniversaryAnchor(contractProduct.value)
    ),

    /** True if the product no longer creates its renewal invoice (R9). */
    hasAutoRenewDisabled: computed(
      () =>
        !contextValue<boolean>(state, "contractProduct.autoCreateRenewInvoice")
    ),

    /** True if the machine captured an error. */
    hasError: computed(() => !!contextValue(state, "error")),

    /** True if the read carried the `scheduled_actions` include. */
    hasFetchedScheduledActions: computed(
      () =>
        !isUndefined(contextValue(state, "contractProduct.scheduledActions"))
    ),

    /** True if the product moved to another contract product. */
    hasMoved: computed(
      () => !!contextValue<boolean>(state, "contractProduct.moved")
    ),

    /** True if a scheduled future cancellation is booked. */
    hasScheduledFutureCancellation,

    /** True if the product carries unpaid recurring invoices. */
    hasUnpaidRecurringInvoices: computed(
      () =>
        !!contextValue<number>(
          state,
          "contractProduct.unpaidRecurringInvoices.length"
        )
    ),

    /** True on `available.status.active`. */
    isActive: useStateMatches(state, ContractProductState.ACTIVE),

    /** True once the product is placed on any `available` node. */
    isAvailable: useStateMatches(state, "available"),

    /**
     * True while an outstanding invoice of this product can still be
     * cancelled. Legacy rule [o23]: `invoice_unpaid` or `invoice_overdue`.
     */
    isCancellable: computed(() =>
      some(unpaidRecurringInvoices.value, isCancellable)
    ),

    /** True on `unavailable.cancelled`. */
    isCancelled: useStateMatches(state, ContractProductState.CANCELLED),

    /** True on `available.status.cancelling`. */
    isCancelling,

    /** True if the product is delegated to this client. */
    isDelegatedAccess: computed(
      () => !!contextValue<boolean>(state, "contractProduct.isDelegatedObject")
    ),

    /**
     * True while an outstanding invoice of this product is still due. Legacy
     * rule [o23]: `invoice_unpaid`, `invoice_adjusted` or `invoice_overdue`.
     */
    isDue: computed(() => some(unpaidRecurringInvoices.value, isDue)),

    /** True when no product is loaded. */
    isEmpty: computed(() => !contractProduct.value),

    /** True on `available.status.expiring`. */
    isExpiring: useStateMatches(state, ContractProductState.EXPIRING),

    /** True on `unavailable.fraud`. */
    isFraud: useStateMatches(state, ContractProductState.FRAUD),

    /** True if the product was imported. */
    isImported: computed(
      () => !!contextValue<string>(state, "contractProduct.importId")
    ),

    /** True on `available.status.inactive` (awaiting activation). */
    isInactive: useStateMatches(state, ContractProductState.INACTIVE),

    /** True on `unavailable.lapsed`. */
    isLapsed: useStateMatches(state, ContractProductState.LAPSED),

    /** True while waiting for a session or reading the product. */
    isLoading: useStateMatches(state, ["subscribing", "loading"]),

    /** True on `available.trial.ending`. */
    isOnTerminatingTrial: useStateMatches(
      state,
      ContractProductState.TRIAL_ENDING
    ),

    /** True on `available.trial.running`. */
    isOnTrial: useStateMatches(state, ContractProductState.TRIAL_RUNNING),

    /** True on `available.status.pending`. */
    isPending,

    /** True on `available.setup.incomplete`. */
    isSetupIncomplete: useStateMatches(
      state,
      ContractProductState.SETUP_INCOMPLETE
    ),

    /** True on `unavailable.staged`. */
    isStaged: useStateMatches(state, ContractProductState.STAGED),

    /** True while a write is in flight. */
    isSubmitting: useStateMatches(state, [
      "processing",
      "available.cancelling.processing",
      "available.consolidating.processing"
    ]),

    /** True if the product is a subscription (`billing_cycle_months > 0`). */
    isSubscription: computed(
      () => !!contextValue<boolean>(state, "contractProduct.isSubscription")
    ),

    /** True on `available.status.suspended`. */
    isSuspended: useStateMatches(state, ContractProductState.SUSPENDED)
  };
}

export type UseContractProductMeta = ReturnType<
  typeof createContractProductMeta
>;
