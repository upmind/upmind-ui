import { computed } from "vue";
import { InvoiceStatus, InvoiceStatusGroups } from "@upmind-automation/types";
import {
  ContractProductMigrationStates,
  ContractProductRegionLoadingStates,
  ContractProductRegionWriteStates,
  ContractProductState
} from "./contract-product.types";
import {
  canDisableAutoRenew,
  canEnableAutoRenew,
  canEndTrial,
  canIssueNextInvoice,
  canMigrateProduct,
  canRequestCancellation,
  canRequestEndOfTerm,
  canScheduleFutureCancellation,
  canConsolidate as isConsolidationEligible,
  isNextInvoiceDateInFuture
} from "./contract-product.utils";
import {
  contextValue,
  stateMatches,
  useContext,
  useStateMatches
} from "../../utils";
import { includes, isEmpty, isUndefined, some, values } from "lodash-es";
import type {
  ContractProduct,
  ContractProductMetaMembers,
  MigrationHolders
} from "./contract-product.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.meta
 * @description Manager meta: the node flags, the record facts, and the gate
 * of each write. Each gate reads the util its machine guard reads, inside the
 * node terms that guard sits behind: a placed node, and no form-region write
 * in flight.
 */
export function createContractProductMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  holders: MigrationHolders
): ContractProductMetaMembers {
  const { state } = actor;
  const contractProduct = useContext<ContractProduct>(state, "contractProduct");

  const isAvailable = useStateMatches(state, "available");
  const isUnavailable = useStateMatches(state, "unavailable");
  const isRegionWriteActive = useStateMatches(
    state,
    values(ContractProductRegionWriteStates)
  );
  // The node terms every lifecycle gate shares with its machine guard.
  const isLifecycleOpen = computed(
    () =>
      (isAvailable.value || isUnavailable.value) && !isRegionWriteActive.value
  );
  const isMigrationOpen = useStateMatches(
    state,
    values(ContractProductMigrationStates)
  );
  /** The product list's meta; `undefined` while the list is not built or the migration is closed. */
  const listMeta = computed(() =>
    isMigrationOpen.value ? holders.list.value?.meta.value : undefined
  );
  const unpaidInvoices = computed(
    () => contractProduct.value?.unpaidRecurringInvoices ?? []
  );

  // --- gates
  const canCommitMigration = computed(
    () =>
      stateMatches(state, [
        "available.migrating.configuring.previewed",
        "available.migrating.configuring.unpreviewed",
        "available.migrating.configuring.error"
      ]) &&
      !isRegionWriteActive.value &&
      stateMatches(holders.config.value?.state, ["available"])
  );
  const canConsolidate = computed(
    () =>
      isAvailable.value &&
      !isRegionWriteActive.value &&
      !!contractProduct.value &&
      isConsolidationEligible(contractProduct.value)
  );
  const canDisable = computed(
    () =>
      isLifecycleOpen.value &&
      !!contractProduct.value &&
      canDisableAutoRenew(contractProduct.value)
  );
  const canEnable = computed(
    () =>
      isLifecycleOpen.value &&
      !!contractProduct.value &&
      canEnableAutoRenew(contractProduct.value)
  );
  const canEnd = computed(
    () =>
      isLifecycleOpen.value &&
      !!contractProduct.value &&
      canEndTrial(contractProduct.value)
  );
  const canIssue = computed(
    () =>
      isLifecycleOpen.value &&
      !!contractProduct.value &&
      canIssueNextInvoice(contractProduct.value)
  );
  const canMigrate = computed(
    () =>
      isAvailable.value &&
      !isMigrationOpen.value &&
      !!contractProduct.value &&
      canMigrateProduct(contractProduct.value)
  );
  const canRequest = computed(
    () =>
      isAvailable.value &&
      !isRegionWriteActive.value &&
      !!contractProduct.value &&
      canRequestCancellation(contractProduct.value)
  );
  const canRequestEnd = computed(
    () =>
      isAvailable.value &&
      !isRegionWriteActive.value &&
      !!contractProduct.value &&
      canRequestEndOfTerm(contractProduct.value)
  );
  const canSchedule = computed(
    () =>
      isAvailable.value &&
      !isRegionWriteActive.value &&
      !!contractProduct.value &&
      canScheduleFutureCancellation(contractProduct.value)
  );
  const canSetBillingEntity = computed(
    () => isLifecycleOpen.value && !!contractProduct.value?.isSubscription
  );
  const canUpdateContractProduct = computed(
    () => isLifecycleOpen.value && !!contractProduct.value
  );
  // --- record facts
  const canCancel = computed(() => !!contractProduct.value?.canCancel);
  const hasAutoRenewDisabled = computed(
    () => !contractProduct.value?.autoCreateRenewInvoice
  );
  const hasError = computed(() => !!contextValue(state, "error"));
  const hasFetchedScheduledActions = computed(
    () => !isUndefined(contractProduct.value?.scheduledActions)
  );
  const hasMoved = computed(() => !!contractProduct.value?.moved);
  const hasPendingProRata = computed(
    () => !!contractProduct.value?.proRataPending
  );
  const hasScheduledFutureCancellation = computed(
    () => !!contractProduct.value?.hasScheduledFutureCancellation
  );
  const hasUnpaidRecurringInvoices = computed(
    () => !isEmpty(unpaidInvoices.value)
  );
  const isCancellableInvoice = computed(() =>
    some(unpaidInvoices.value, invoice =>
      includes(
        [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE],
        invoice.invoice_status?.code
      )
    )
  );
  const isDelegatedAccess = computed(
    () => !!contractProduct.value?.isDelegatedObject
  );
  const isDueInvoice = computed(() =>
    some(unpaidInvoices.value, invoice =>
      includes(InvoiceStatusGroups.UNPAID, invoice.invoice_status?.code)
    )
  );
  const isEmptyProduct = computed(() => !contractProduct.value);
  const isImported = computed(() => !!contractProduct.value?.importId);
  const isNextInvoiceDateAhead = computed(
    () =>
      !!contractProduct.value &&
      isNextInvoiceDateInFuture(contractProduct.value)
  );
  const isSubscription = computed(
    () => !!contractProduct.value?.isSubscription
  );

  // --- migration
  const isMigrationFree = computed(
    () => !!contextValue(state, "migration.preview.isFree")
  );
  const isPaymentRequired = computed(
    () => !!contextValue(state, "migrationResult.requiresPayment")
  );
  const hasMigrationTargetsError = computed(() => !!listMeta.value?.hasError);
  const hasMoreMigrationTargets = computed(() => !!listMeta.value?.hasNextPage);
  const hasNoMigrationTargets = computed(
    () =>
      !!listMeta.value && !listMeta.value.isLoading && listMeta.value.isEmpty
  );
  const isMigrationTargetsLoading = computed(
    () => !!listMeta.value?.isLoading && !listMeta.value.isLoadingMore
  );
  const isMigrationTargetsLoadingMore = computed(
    () => !!listMeta.value?.isLoadingMore
  );

  // --- nodes
  const isActive = useStateMatches(state, ContractProductState.ACTIVE);
  const isBillingEntityOpen = useStateMatches(state, [
    "available.billingEntity.loading",
    "available.billingEntity.available",
    "available.billingEntity.processing",
    "unavailable.billingEntity.loading",
    "unavailable.billingEntity.available",
    "unavailable.billingEntity.processing"
  ]);
  const isBillingEntityValid = useStateMatches(state, [
    "available.billingEntity.available.valid",
    "unavailable.billingEntity.available.valid"
  ]);
  const isCancellationOpen = useStateMatches(state, [
    "available.cancelling.loading",
    "available.cancelling.available",
    "available.cancelling.processing"
  ]);
  const isCancellationValid = useStateMatches(
    state,
    "available.cancelling.available.valid"
  );
  const isCancelled = useStateMatches(state, ContractProductState.CANCELLED);
  const isCancelling = useStateMatches(state, ContractProductState.CANCELLING);
  const isChoosingMigrationTarget = useStateMatches(
    state,
    ContractProductMigrationStates.CHOOSING
  );
  const isConsolidationOpen = useStateMatches(state, [
    "available.consolidating.available",
    "available.consolidating.processing"
  ]);
  const isConsolidationValid = useStateMatches(
    state,
    "available.consolidating.available.valid"
  );
  const isExpiring = useStateMatches(state, ContractProductState.EXPIRING);
  const isFraud = useStateMatches(state, ContractProductState.FRAUD);
  const isInactive = useStateMatches(state, ContractProductState.INACTIVE);
  const isLapsed = useStateMatches(state, ContractProductState.LAPSED);
  const isLoading = useStateMatches(state, ["subscribing", "loading"]);
  const isMigrationPreviewed = useStateMatches(
    state,
    "available.migrating.configuring.previewed"
  );
  const isMigrationPreviewing = useStateMatches(
    state,
    "available.migrating.configuring.previewing"
  );
  const isMigrationProcessing = useStateMatches(
    state,
    ContractProductRegionWriteStates.MIGRATING
  );
  const isMigrationTargetLoading = useStateMatches(
    state,
    "available.migrating.configuring.loading"
  );
  const isMigrationTargetUnavailable = useStateMatches(
    state,
    "available.migrating.configuring.unavailable"
  );
  const isOnTerminatingTrial = useStateMatches(
    state,
    ContractProductState.TRIAL_ENDING
  );
  const isOnTrial = useStateMatches(state, ContractProductState.TRIAL_RUNNING);
  const isPending = useStateMatches(state, ContractProductState.PENDING);
  const isProcessing = useStateMatches(state, [
    "processing",
    ...values(ContractProductRegionLoadingStates),
    ...values(ContractProductRegionWriteStates)
  ]);
  const isSetupIncomplete = useStateMatches(
    state,
    ContractProductState.SETUP_INCOMPLETE
  );
  const isStaged = useStateMatches(state, ContractProductState.STAGED);
  const isSuspended = useStateMatches(state, ContractProductState.SUSPENDED);

  return {
    /** True if the platform reports the product as cancellable. */
    canCancel,
    /** True when the open migration can be committed: no dry run is in flight and the configurator can take the commit. The platform, not local validation, judges it. */
    canCommitMigration,
    /** True when the consolidation form may be opened: an `available` node and consolidation allowed. */
    canConsolidate,
    /** True when renewal invoicing may be turned off. The unpaid invoices of the product do not hold it back; a consumer that wants them to reads the set through `useInvoices().as("client").for("contracts_product", id)`. */
    canDisableAutoRenew: canDisable,
    /** True when renewal invoicing may be turned on. */
    canEnableAutoRenew: canEnable,
    /** True when the trial may be ended early: in trial and not awaiting activation, on any node. */
    canEndTrial: canEnd,
    /** True when the next invoice may be raised now: a subscription, not staged, and the platform allows it. */
    canIssueNextInvoice: canIssue,
    /** True when the client may start a migration. */
    canMigrate,
    /** True when the client may request immediate cancellation (HARD), which is also when the cancellation form may be opened. */
    canRequestCancellation: canRequest,
    /** True when the client may cancel at the end of the term (SOFT). */
    canRequestEndOfTerm: canRequestEnd,
    /** True when a cancellation can be booked for a future anniversary. */
    canScheduleFutureCancellation: canSchedule,
    /** True when the billing entity may change: a subscription on any placed node. */
    canSetBillingEntity,
    /** True when the client label may be set, on any node. */
    canUpdateContractProduct,
    /** True if the product no longer creates its renewal invoice. */
    hasAutoRenewDisabled,
    /** True if the machine captured an error. */
    hasError,
    /** True if the read carried the `scheduled_actions` include. */
    hasFetchedScheduledActions,
    /** True if the product list failed to load. */
    hasMigrationTargetsError,
    /** True if the product list has another page. */
    hasMoreMigrationTargets,
    /** True if the product moved to another contract product. */
    hasMoved,
    /** True if the product list loaded and holds no product. */
    hasNoMigrationTargets,
    /** True if the product's pro-rata invoice from an earlier migration is still unpaid. */
    hasPendingProRata,
    /** True if a scheduled future cancellation is booked. */
    hasScheduledFutureCancellation,
    /** True if the product carries unpaid recurring invoices. */
    hasUnpaidRecurringInvoices,
    /** True on `available.status.active`. */
    isActive,
    /** True once the product is placed on any `available` node. */
    isAvailable,
    /** True while the billing-entity form is open (loading, available or processing). */
    isBillingEntityOpen,
    /** True when the open billing-entity form passes validation. */
    isBillingEntityValid,
    /** True while an outstanding invoice of this product can still be cancelled: `invoice_unpaid` or `invoice_overdue`. */
    isCancellable: isCancellableInvoice,
    /** True while the cancellation form is open (loading, available or processing). */
    isCancellationOpen,
    /** True when the open cancellation form passes validation. */
    isCancellationValid,
    /** True on `unavailable.status.cancelled`. */
    isCancelled,
    /** True on `available.status.cancelling`. */
    isCancelling,
    /** True when the product list is open. */
    isChoosingMigrationTarget,
    /** True while the consolidation form is open (available or processing). */
    isConsolidationOpen,
    /** True when the open consolidation form passes validation. */
    isConsolidationValid,
    /** True if the product is delegated to this client. */
    isDelegatedAccess,
    /** True while an outstanding invoice of this product is still due: `invoice_unpaid`, `invoice_adjusted` or `invoice_overdue`. */
    isDue: isDueInvoice,
    /** True when no product is loaded. */
    isEmpty: isEmptyProduct,
    /** True on `available.status.expiring`. */
    isExpiring,
    /** True on `unavailable.status.fraud`. */
    isFraud,
    /** True if the product was imported. */
    isImported,
    /** True on `available.status.inactive` (awaiting activation). */
    isInactive,
    /** True on `unavailable.status.lapsed`. */
    isLapsed,
    /** True while waiting for a session or reading the product. */
    isLoading,
    /** True when a dry run says the migration costs nothing. */
    isMigrationFree,
    /** True while a migration is open: the product list, or a chosen product. */
    isMigrationOpen,
    /** True when the dry run of the chosen product has a cost. */
    isMigrationPreviewed,
    /** True while the dry run is in flight. */
    isMigrationPreviewing,
    /** True while the commit is in flight. */
    isMigrationProcessing,
    /** True while the chosen product loads. */
    isMigrationTargetLoading,
    /** True while the product list loads its first page. */
    isMigrationTargetsLoading,
    /** True while the product list loads another page. */
    isMigrationTargetsLoadingMore,
    /** True when the chosen product failed to load. */
    isMigrationTargetUnavailable,
    /** True when the next invoice date is still ahead by the UTC end of its day; false when there is no date. */
    isNextInvoiceDateInFuture: isNextInvoiceDateAhead,
    /** True on `available.trial.ending`. */
    isOnTerminatingTrial,
    /** True on `available.trial.running`. */
    isOnTrial,
    /** True when the committed migration left an amount to pay. */
    isPaymentRequired,
    /** True on `available.status.pending`. */
    isPending,
    /** True while a write is in flight, or a direct write waits for its form to open. */
    isProcessing,
    /** True on `available.setup.incomplete`. */
    isSetupIncomplete,
    /** True on `unavailable.status.staged`. */
    isStaged,
    /** True if the product is a subscription (`billing_cycle_months > 0`). */
    isSubscription,
    /** True on `available.status.suspended`. */
    isSuspended,
    /** True once the product is placed on any `unavailable` node. */
    isUnavailable
  };
}

export type UseContractProductMeta = ReturnType<
  typeof createContractProductMeta
>;
