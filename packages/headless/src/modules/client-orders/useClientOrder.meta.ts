import { computed } from "vue";
import { isCancellable, isDue } from "../contract-product";
import { mapInvoice } from "../invoices";
import { useActiveSession } from "../session-store";
import {
  canCancel,
  canPay,
  isCancelled,
  isOverdue,
  isPartiallyPaid,
  isPaid
} from "./client-orders.utils";
import { some } from "lodash-es";
import type {
  ClientOrderExtras,
  ClientOrderItemQuery,
  ClientOrderServices
} from "./client-orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrder.meta
 * @description Manager meta — the order conditions (design 8.5, ruling R1)
 * plus the read-lifecycle flags. `isDue`/`isCancellable` are consumed from
 * the FE-3029 `contract-product` barrel; the delegated marker and pending
 * payment reuse `mapInvoice` from `invoices` (design 5.1, [h12]).
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientOrderMeta(
  _actorScope: ScopeActorTypes,
  service: ClientOrderServices,
  query: ClientOrderItemQuery,
  extras: ClientOrderExtras
) {
  const { activeUser } = useActiveSession().useContext();

  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  const isComplete = computed(() => query.isFetched.value && !hasError.value);

  const isEmptyOrder = computed(() => !query.data.value);

  const mappedInvoice = computed(() => {
    const raw = query.data.value;
    return raw ? mapInvoice(raw, activeUser.value?.id) : undefined;
  });

  const dueMeta = computed(() => {
    const raw = query.data.value;
    return raw ? isDue(raw) : false;
  });

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useClientOrder.meta.{actor}.ts` and spread it LAST.

  return {
    /** True while the order is due — status in `InvoiceStatusGroups.UNPAID` (design 8.5). */
    isDue: dueMeta,

    /** Alias of `isDue` — no second function (design 8.5). */
    isPayable: dueMeta,

    /** True while the order is due AND `[UNPAID, OVERDUE]` (design 8.5). */
    isCancellable: computed(() =>
      query.data.value ? isCancellable(query.data.value) : false
    ),

    /** True while the order's status is `OVERDUE` (design 8.5). */
    isOverdue: computed(() =>
      query.data.value ? isOverdue(query.data.value) : false
    ),

    /** True while the order's status is `PAID` (design 8.5). */
    isPaid: computed(() =>
      query.data.value ? isPaid(query.data.value) : false
    ),

    /** True while the order is `CANCELLED` or `CANCELLATION_REQUEST` (design 8.5). */
    isCancelled: computed(() =>
      query.data.value ? isCancelled(query.data.value) : false
    ),

    /** True while the order is due and carries both a paid and an unpaid amount (design 8.5). */
    isPartiallyPaid: computed(() =>
      query.data.value ? isPartiallyPaid(query.data.value) : false
    ),

    /** True while the order is due and still carries an unpaid balance (design 8.5). */
    canPay: computed(() =>
      query.data.value ? canPay(query.data.value) : false
    ),

    /** True while the order is due and cancelling it still means anything (design 8.5). */
    canCancel: computed(() =>
      query.data.value ? canCancel(query.data.value) : false
    ),

    /** True while any payment on this order is pending (design 8.5, [h12]). */
    hasPendingPayment: computed(() =>
      some(mappedInvoice.value?.payments, "meta.isPending")
    ),

    /** True while this order is a delegated (co-mingled) order (design 8.5, [h12]). */
    isDelegated: computed(() => !!mappedInvoice.value?.attribution.isDelegated),

    /** True while the order's brand has an online gateway (design 8.1, D-15, D-26). */
    hasOnlineGateways: extras.hasOnlineGateways,

    /** True while this scope can address the given order id for the session client. */
    isAvailable: service.isAvailable,

    /** True once the single read has settled with no error. */
    isComplete,

    /** True while this scope's order could not be resolved (design 8.11). */
    isEmpty: isEmptyOrder,

    /** True while the single read has not yet completed its first fetch. */
    isLoading,

    /** True while a `cancel()` call that reached the port is pending (design 8.6). */
    isProcessing: computed(() => extras.isProcessing.value),

    /** True if the single read failed. */
    hasError

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientOrderManagerMeta = ReturnType<
  typeof createClientOrderMeta
>;
