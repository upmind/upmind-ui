import { computed } from "vue";
import { ContractStatusCodes } from "@upmind-automation/types";
import { ContractProductState } from "./contract-product.types";
import {
  anniversaryAnchor,
  canMigrateProduct,
  cancellationOptions,
  canConsolidate as isConsolidationEligible,
  hasHardCancellationRequest,
  isCancellable,
  isDue
} from "./contract-product.utils";
import {
  contextValue,
  stateMatches,
  useContext,
  useStateMatches
} from "../../utils";
import { isEmpty, isUndefined, some } from "lodash-es";
import type {
  ContractProduct,
  MigrationHolders,
  MigrationResult,
  UnpaidInvoice
} from "./contract-product.types";
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
  actor: UseActor,
  holders: MigrationHolders
) {
  const { state } = actor;

  const contractProduct = useContext<ContractProduct>(state, "contractProduct");

  const isAvailable = useStateMatches(state, "available");

  const isCancelling = useStateMatches(state, ContractProductState.CANCELLING);

  const isPending = useStateMatches(state, ContractProductState.PENDING);

  const hasScheduledFutureCancellation = computed(
    () =>
      !!contextValue<boolean>(
        state,
        "contractProduct.hasScheduledFutureCancellation"
      )
  );

  const isMigrationOpen = useStateMatches(state, [
    "available.migrating.choosing",
    "available.migrating.configuring"
  ]);

  /** The plan list's meta; `undefined` while the list is not built or the change is closed. */
  const listMeta = computed(() =>
    isMigrationOpen.value ? holders.list.value?.meta.value : undefined
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
     * True when the consolidation form may be opened at all: the product is on
     * an `available` node (staged, cancelled, lapsed and fraud refuse, P4g) and
     * passes the machine's `canConsolidate` guard (G3).
     */
    canConsolidate: computed(
      () =>
        isAvailable.value &&
        !!contractProduct.value &&
        isConsolidationEligible(contractProduct.value)
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

    /** True when the client may start a change of plan: the offer clauses and the start clauses (R14). */
    canMigrate: computed(
      () => !!contractProduct.value && canMigrateProduct(contractProduct.value)
    ),

    /** True when the open change of plan can be committed: a dry run is not in flight, and the configurator can take the commit. Local validation does not gate it; the platform judges it (R8). */
    canCommitMigration: computed(
      () =>
        stateMatches(state, [
          "available.migrating.configuring.previewed",
          "available.migrating.configuring.unpreviewed",
          "available.migrating.configuring.error"
        ]) && holders.isMigrationTargetReady.value
    ),

    /** True if the product's pro-rata invoice from an earlier change is still unpaid. */
    hasPendingProRata: computed(
      () => !!contextValue<boolean>(state, "contractProduct.proRataPending")
    ),

    /** True if the plan list failed to load. */
    hasMigrationTargetsError: computed(() => !!listMeta.value?.hasError),

    /** True if the plan list has another page. */
    hasMoreMigrationTargets: computed(() => !!listMeta.value?.hasNextPage),

    /** True if the plan list loaded and holds no plan. */
    hasNoMigrationTargets: computed(
      () =>
        !!listMeta.value && !listMeta.value.isLoading && listMeta.value.isEmpty
    ),

    /** True if the product no longer creates its renewal invoice (R9). */
    hasAutoRenewDisabled: computed(
      () =>
        !contextValue<boolean>(state, "contractProduct.autoCreateRenewInvoice")
    ),

    /**
     * True when the cancellation form may be opened at all: the product is on
     * an `available` node (staged, cancelled, lapsed and fraud refuse, P4g) and
     * passes the machine's `hasCancellationOptions` guard (G2).
     */
    hasCancellationOptions: computed(
      () =>
        isAvailable.value &&
        !!contractProduct.value &&
        !isEmpty(cancellationOptions(contractProduct.value))
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
    isAvailable,

    /**
     * True while an outstanding invoice of this product can still be
     * cancelled. Legacy rule [o23]: `invoice_unpaid` or `invoice_overdue`.
     */
    isCancellable: computed(() =>
      some(unpaidRecurringInvoices.value, isCancellable)
    ),

    /** True while the cancellation form is open (available or processing). */
    isCancellationOpen: useStateMatches(state, [
      "available.cancelling.available",
      "available.cancelling.processing"
    ]),

    /** True when the open cancellation form passes validation. */
    isCancellationValid: useStateMatches(
      state,
      "available.cancelling.available.valid"
    ),

    /** True on `unavailable.cancelled`. */
    isCancelled: useStateMatches(state, ContractProductState.CANCELLED),

    /** True on `available.status.cancelling`. */
    isCancelling,

    /** True while the consolidation form is open (available or processing). */
    isConsolidationOpen: useStateMatches(state, [
      "available.consolidating.available",
      "available.consolidating.processing"
    ]),

    /** True when the open consolidation form passes validation. */
    isConsolidationValid: useStateMatches(
      state,
      "available.consolidating.available.valid"
    ),

    /** True when the plan list is open. */
    isChoosingMigrationTarget: useStateMatches(
      state,
      "available.migrating.choosing"
    ),

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

    /** True when a dry run says the change costs nothing. */
    isMigrationFree: computed(
      () => !!contextValue<boolean>(state, "migration.preview.isFree")
    ),

    /** True while a change of plan is open: the plan list, or a chosen plan. */
    isMigrationOpen,

    /** True while the dry run is in flight. */
    isMigrationPreviewing: useStateMatches(
      state,
      "available.migrating.configuring.previewing"
    ),

    /** True when the dry run of the chosen plan has a cost. */
    isMigrationPreviewed: useStateMatches(
      state,
      "available.migrating.configuring.previewed"
    ),

    /** True while the commit is in flight. */
    isMigrationProcessing: useStateMatches(
      state,
      "available.migrating.configuring.processing"
    ),

    /** True while the chosen plan loads. */
    isMigrationTargetLoading: useStateMatches(
      state,
      "available.migrating.configuring.loading"
    ),

    /** True when the chosen plan failed to load. */
    isMigrationTargetUnavailable: useStateMatches(
      state,
      "available.migrating.configuring.unavailable"
    ),

    /** True while the plan list loads its first page. */
    isMigrationTargetsLoading: computed(
      () => !!listMeta.value?.isLoading && !listMeta.value.isLoadingMore
    ),

    /** True while the plan list loads another page. */
    isMigrationTargetsLoadingMore: computed(
      () => !!listMeta.value?.isLoadingMore
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

    /** True while a write is in flight. */
    isProcessing: useStateMatches(state, [
      "processing",
      "available.cancelling.processing",
      "available.consolidating.processing",
      "available.migrating.configuring.processing"
    ]),

    /** True on `available.setup.incomplete`. */
    isSetupIncomplete: useStateMatches(
      state,
      ContractProductState.SETUP_INCOMPLETE
    ),

    /** True on `unavailable.staged`. */
    isStaged: useStateMatches(state, ContractProductState.STAGED),

    /** True if the product is a subscription (`billing_cycle_months > 0`). */
    isSubscription: computed(
      () => !!contextValue<boolean>(state, "contractProduct.isSubscription")
    ),

    /** True on `available.status.suspended`. */
    isSuspended: useStateMatches(state, ContractProductState.SUSPENDED),

    /** True when the committed change of plan left an amount to pay. */
    requiresPayment: computed(
      () =>
        !!contextValue<MigrationResult>(state, "migrationResult")
          ?.requiresPayment
    )
  };
}

export type UseContractProductMeta = ReturnType<
  typeof createContractProductMeta
>;
