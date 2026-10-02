import { computed } from "vue";
import { useActiveSession } from "../session-store";
import { canChangePaymentCurrency } from "./invoice.utils";
import {
  machineMatches,
  stateMatches,
  useChildActor,
  useContext,
  useContextActor
} from "../../utils";
import { isEmpty, some } from "lodash-es";
import type { Invoice, InvoiceBrandConfig } from "./invoices.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.meta
 * @description Single-invoice meta — one computed per flag, the payment-state
 * flags derived from the invoice summary and machine state.
 */
export function createInvoiceMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  paymentFailed: Ref<boolean>
) {
  const { state } = actor;
  const { isAuthenticated, isGuestClient } = useActiveSession().useMeta();

  const invoice = useContext<Invoice | undefined>(state, "invoice");
  const errors = useContext<ResponseError | undefined>(state, "error");
  const conversionError = useContext<ResponseError | undefined>(
    state,
    "conversionError"
  );
  const config = useContext<InvoiceBrandConfig | undefined>(state, "config");
  const paymentDetailActor = useContextActor(state, "paymentDetailActor");
  const payment = useChildActor(state, "payment");

  const isAvailable = computed(() => stateMatches(state, ["available"]));
  const isFailed = computed(
    () =>
      (stateMatches(state, ["available.collecting"]) &&
        !isEmpty(errors.value)) ||
      paymentFailed.value
  );
  const hasPendingPayment = computed(() =>
    some(invoice.value?.payments, "meta.isPending")
  );
  const paidAmount = computed(() => invoice.value?.summary.paidAmount ?? 0);
  const unpaidAmount = computed(() => invoice.value?.summary.unpaidAmount ?? 0);

  return {
    /** True while an error, a failed attempt or a failed pay-currency change
     * sits on an available invoice. */
    hasError: computed(
      () =>
        isAvailable.value && (isFailed.value || !isEmpty(conversionError.value))
    ),

    /** True while the invoice is owed and unlocked — the gate legacy offers
     * "change payment method" on (`invoiceActions.vue`, `isPayable`). */
    canUpdatePaymentMethod: computed(
      () =>
        isAvailable.value && unpaidAmount.value > 0 && !invoice.value?.locked
    ),

    /** True when the brand allows a different pay currency and nothing of the
     * invoice is paid yet — the gate `useActions().setCurrency()` obeys. */
    hasPaymentCurrencyChoice: computed(
      () =>
        isAvailable.value &&
        canChangePaymentCurrency(config.value, invoice.value)
    ),

    /** True when the reading session is authenticated. */
    isAuthenticated: computed(() => isAuthenticated.value),

    /** True once the invoice has loaded and the pay flow is active. */
    isAvailable,

    /** True when the reading client is a guest — no full account yet. */
    isGuestClient: computed(() => isGuestClient.value),

    /** True once the pay flow has completed (paid in full or free). */
    isComplete: computed(() => stateMatches(state, ["complete"])),

    /** True if this invoice is free — never charged, nothing owed. */
    isFree: computed(
      () => isEmpty(invoice.value?.payments) && unpaidAmount.value === 0
    ),

    /** True while the invoice is loading. */
    isLoading: computed(() => stateMatches(state, ["subscribing", "loading"])),

    /** True if the invoice cannot accept a new payment method. */
    isLocked: computed(() => !!invoice.value?.locked),

    /** True if some but not all of this invoice has been paid. */
    isPartial: computed(
      () => isAvailable.value && paidAmount.value > 0 && unpaidAmount.value > 0
    ),

    /** True while payment is due and nothing is settled or pending. */
    isPaymentDue: computed(
      () =>
        isAvailable.value &&
        !isFailed.value &&
        !hasPendingPayment.value &&
        paidAmount.value === 0 &&
        unpaidAmount.value > 0
    ),

    /** True while a payment is in flight (pending settlement). */
    isPending: computed(() => isAvailable.value && hasPendingPayment.value),

    /** True while a payment, refresh or pay-currency conversion is processing. */
    isProcessing: computed(
      () =>
        stateMatches(state, [
          "available.converting",
          "available.paying",
          "available.refreshing"
        ]) || machineMatches(paymentDetailActor, ["processing", "finalising"])
    ),

    /** True during the post-payment balance re-fetch — the machine enters this
     * refresh only after a payment captures, so it is the "a payment landed"
     * signal (full or partial). */
    isSettling: computed(() => stateMatches(state, ["available.refreshing"])),

    /** True while an inline 3DS challenge awaits approval. */
    needsApproval: computed(() => machineMatches(payment, ["challenging"])),

    /** True while an inline challenge is rendering into its container. */
    isRenderingChallenge: computed(() =>
      machineMatches(payment, ["challenging.render"])
    ),

    /** True if the invoice could not be loaded. */
    isUnavailable: computed(() => stateMatches(state, ["unavailable"]))
  };
}

// Type export for consumers
export type UseInvoiceMeta = ReturnType<typeof createInvoiceMeta>;
