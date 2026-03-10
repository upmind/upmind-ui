// --- external
import { computed, onUnmounted, ref, watch } from "vue";
import { interpret } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import orderMachine from "./order.machine";
import { usePaymentDetail, usePaymentGateway } from "../paymentDetails";
import { useSession } from "../session";
import { useQueryParams } from "../routing/useQueryParams";

// --- utils
import {
  stateMatches,
  stopService,
  useContext,
  useContextActor
} from "../../utils";
import { isEmpty, some } from "lodash-es";

// --- types
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
  const { meta: authMeta } = useSession();
  const { getParam, setParam } = useQueryParams();

  // --- state

  const paymentFailed = ref(getParam("payment_success") === false);

  const service = interpret(
    orderMachine.withContext({ invoiceId } as OrderContext),
    { devTools: true }
  ).start();

  const { state, send } = useActor(service);

  const paymentDetailActor = useContextActor(state, "paymentDetailActor");

  const paymentDetails = usePaymentDetail(paymentDetailActor);
  const gateway = usePaymentGateway(paymentDetails.gateway);

  // --- context

  const invoice = useContext<OrderContext["invoice"]>(state, "invoice");
  const errors = useContext<ResponseError>(state, "error");

  const meta = computed(() => {
    const isAvailable = stateMatches(state, ["available"]);
    const isFree =
      isEmpty(invoice.value?.payments) &&
      invoice.value?.summary.unpaidAmount === 0;

    return {
      hasError:
        stateMatches(state, ["available.failed"]) ||
        (isAvailable && paymentFailed.value),
      isAuthenticated: authMeta.value.isAuthenticated,
      isAvailable,
      isLocked: !!invoice.value?.locked,
      isComplete: stateMatches(state, ["complete"]),
      isFree,
      isLoading: stateMatches(state, ["subscribing", "loading"]),
      isPartial:
        isAvailable &&
        (invoice.value?.summary.paidAmount ?? 0) > 0 &&
        (invoice.value?.summary.unpaidAmount ?? 0) > 0,
      isPending: isAvailable && some(invoice.value?.payments, "meta.isPending"),
      isProcessing: stateMatches(state, [
        "available.paying",
        "available.refreshing"
      ]),
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
    () => stateMatches(state, ["available.failed"]),
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
    paymentDetails,

    /** Re-fetch the invoice (e.g. after offsite 3DS return). */
    refresh,

    /** Retry a failed payment. */
    retry
  };
};

export type UseOrder = ReturnType<typeof useOrder>;
