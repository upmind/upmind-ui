import { useActor } from "@xstate/vue";
import { computed, onUnmounted, ref, watch } from "vue";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { usePaymentDetail, usePaymentGateway } from "../payment-details";
import { useQueryParams } from "../routing/useQueryParams";
import { useActiveSession } from "../session-store";
import orderMachine from "./order.machine";
import {
  machineMatches,
  stateMatches,
  stopService,
  useChildActor,
  useContext,
  useContextActor
} from "../../utils";
import { isEmpty, some } from "lodash-es";
import type { OrderContext } from "./order.types";
import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------
/**
 * @module orders/useOrder
 * @description Composable that orchestrates invoice payment via the order machine.
 * Spawns paymentDetailMachine as a child actor, invokes paymentMachine for processing,
 * and supports retry and partial payment loops.
 */

export const useOrder = (invoiceId: string) => {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { getParam, setParam } = useQueryParams();

  // --- state

  const paymentFailed = ref(getParam("payment_success") === false);

  const service = interpret(
    orderMachine.withContext({ invoiceId } as OrderContext),
    { devTools: true }
  ).start();

  const { state, send } = useActor(service);

  const paymentDetailActor = useContextActor(state, "paymentDetailActor");

  const paymentDetail = usePaymentDetail(paymentDetailActor);
  const gateway = usePaymentGateway(paymentDetail.gateway);

  const payment = useChildActor(state, "payment");

  // --- context

  const invoice = useContext<OrderContext["invoice"]>(state, "invoice");
  const errors = useContext<ResponseError>(state, "error");

  const meta = computed(() => {
    const isAvailable = stateMatches(state, ["available"]);
    const isFailed =
      (stateMatches(state, ["available.collecting"]) &&
        !isEmpty(errors.value)) ||
      paymentFailed.value;
    const hasPendingPayment = some(invoice.value?.payments, "meta.isPending");
    const paidAmount = invoice.value?.summary.paidAmount ?? 0;
    const unpaidAmount = invoice.value?.summary.unpaidAmount ?? 0;
    const isFree = isEmpty(invoice.value?.payments) && unpaidAmount === 0;

    return {
      hasError: isAvailable && isFailed,
      isAuthenticated: isAuthenticated.value,
      isAvailable,
      isLocked: !!invoice.value?.locked,
      isComplete: stateMatches(state, ["complete"]),
      isFree,
      isLoading: stateMatches(state, ["subscribing", "loading"]),
      isPartial: isAvailable && paidAmount > 0 && unpaidAmount > 0,
      isPaymentDue:
        isAvailable &&
        !isFailed &&
        !hasPendingPayment &&
        paidAmount === 0 &&
        unpaidAmount > 0,
      isPending: isAvailable && hasPendingPayment,
      isProcessing:
        stateMatches(state, ["available.paying", "available.refreshing"]) ||
        machineMatches(paymentDetailActor, ["processing", "finalising"]),
      needsApproval: machineMatches(payment, ["challenging"]),
      isRenderingChallenge: machineMatches(payment, ["challenging.render"]),
      isUnavailable: stateMatches(state, ["unavailable"])
    };
  });

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      s => stateMatches(s, ["available", "complete", "unavailable"]),
      { timeout: 30_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  // --- methods

  function pay() {
    send({ type: "PAY" });
  }

  function retry() {
    paymentFailed.value = false;
    send({ type: "RETRY" });
  }

  function refresh() {
    send({ type: "REFRESH" });
  }

  /**
   * Renders an inline payment challenge into the provided container.
   * Call when meta.isRenderingChallenge is true and the container is mounted.
   */
  function renderChallenge(container: HTMLElement): void {
    payment.value?.send({
      type: "RENDER",
      data: { container, onComplete: completeChallenge }
    });
  }

  /**
   * Completes an inline challenge with optional response data.
   * Triggers verification of the challenge.
   * @param data - Optional data from the challenge completion.
   */
  function completeChallenge(data?: Record<string, unknown>): void {
    payment.value?.send({ type: "CHALLENGE_RESPONSE", data });
  }

  /**
   * Cancels an inline payment challenge.
   */
  function cancelChallenge(): void {
    payment.value?.send({ type: "CHALLENGE_CANCELLED" });
  }

  onUnmounted(() => {
    stopService(service);
  });

  watch(
    () => stateMatches(state, ["available.refreshing", "complete"]),
    success => {
      if (success) {
        paymentFailed.value = false;
        setParam("payment_success", "true", true);
      }
    }
  );

  watch(
    () =>
      stateMatches(state, ["available.collecting"]) && !isEmpty(errors.value),
    failed => {
      if (failed) {
        paymentFailed.value = true;
        setParam("payment_success", "false", true);
      }
    }
  );

  // ---------------------------------------------------------------------------

  return {
    /** Payment errors from the last attempt. */
    errors,

    /** Delegated gateway composable. */
    gateway,

    /** The loaded invoice data. */
    invoice,

    /** Resolves when the order machine is ready for interaction. */
    isReady,

    /** Payment state meta. */
    meta,

    /** Trigger the payment flow. */
    pay,

    /** Delegated payment detail composable (for provide/inject). */
    paymentDetail,

    /** Re-fetch the invoice (e.g. after offsite 3DS return). */
    refresh,

    /** Renders an inline payment challenge into the provided container. */
    renderChallenge,

    /** Cancels an inline payment challenge. */
    cancelChallenge,

    /** Retry a failed payment. */
    retry
  };
};

export type UseOrder = ReturnType<typeof useOrder>;
