import { computed } from "vue";
import { PAYMENT_STATE } from "./invoices.types";
import { isEmpty, some } from "lodash-es";
import type {
  Invoice,
  InvoiceItemQuery,
  InvoicesServices,
  PaymentState
} from "./invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.meta
 * @description Single-read meta — computed state flags, one computed per
 * flag. `paymentState` wires the pre-conversion dead {@link PAYMENT_STATE}
 * enum (design D3), replacing four booleans (`invoices.ts:24-44`
 * pre-conversion) that could previously disagree with each other with ONE
 * discriminated value.
 * @doctrine clause 2 — shared-only (armless).
 */
export function createInvoiceMeta(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoiceItemQuery
) {
  const hasError = computed(() => !!service.error.value || !!query.error.value);

  const isEmptyResult = computed(() => isEmpty(query.data.value?.id));

  const isLoading = computed(
    () => query.isLoading.value || !query.isFetched.value
  );

  const isComplete = computed(() => query.isFetched.value);

  /**
   * ONE discriminated derivation over `summary.unpaidAmount` /
   * `summary.paidAmount` / `payments[]` — the source the four pre-conversion
   * booleans each read independently and could disagree over.
   *
   * A failed/absent load reports `FAILED`, never a guessed state (AC-16's
   * guard scenario): `FAILED` is the one member the four booleans below
   * never wrap, so a load failure cannot masquerade as a genuine payment
   * outcome. `hasError` is what tells the two apart from a real failed
   * payment attempt.
   */
  const paymentState = computed<PaymentState>(() => {
    const invoice = query.data.value;
    if (isEmpty(invoice?.summary)) return PAYMENT_STATE.FAILED;

    const { payments, summary } = invoice as Invoice;

    if (summary.unpaidAmount === 0) {
      return isEmpty(payments) ? PAYMENT_STATE.FREE : PAYMENT_STATE.COMPLETE;
    }
    if (summary.paidAmount > 0) return PAYMENT_STATE.PARTIAL;
    if (some(payments, payment => payment.meta.isPending)) {
      return PAYMENT_STATE.PENDING;
    }
    return isEmpty(payments) ? PAYMENT_STATE.PENDING : PAYMENT_STATE.FAILED;
  });

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns
  // one, add `useInvoice.meta.{actor}.ts` and spread it LAST.

  return {
    /** True if the item query, or the unpaid-amount read, failed. */
    hasError,

    /**
     * True while this scope can address a client — authenticated, with a
     * resolved client id. Handed straight through from the services
     * instance: this IS the predicate the request gates call, not a second
     * copy of it.
     */
    isAvailable: service.isAvailable,

    /** True once the first fetch has completed, regardless of outcome. */
    isComplete,

    /** True if this scope's invoice carries no id. */
    isEmpty: isEmptyResult,

    /** True if this invoice is free — never charged, nothing owed. */
    isFree: computed(() => paymentState.value === PAYMENT_STATE.FREE),

    /** True if the invoice is locked (cannot accept new payment methods). */
    isLocked: computed(() => !!query.data.value?.locked),

    /** True while the read is loading or has not completed its first fetch. */
    isLoading,

    /** True if this invoice is paid in full. */
    isPaid: computed(() => paymentState.value === PAYMENT_STATE.COMPLETE),

    /** True if some but not all of this invoice has been paid. */
    isPartiallyPaid: computed(
      () => paymentState.value === PAYMENT_STATE.PARTIAL
    ),

    /** True while this invoice has no settled payment and something is owed. */
    isPending: computed(() => paymentState.value === PAYMENT_STATE.PENDING),

    /** AC13 — false for a delegated invoice (`invoiceStatusMsg.vue:118-124`). */
    isSettleable: computed(
      () => query.data.value?.attribution?.isSettleable ?? false
    ),

    /** The wired discriminated payment state (design D3). */
    paymentState

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseInvoiceMeta = ReturnType<typeof createInvoiceMeta>;
