import { waitFor } from "xstate/lib/waitFor";
import { remove as removeFromRegistry } from "../scope";
import {
  downloadPdf as downloadInvoicePdf,
  updatePaymentDetails as updateInvoicePaymentDetails
} from "./invoice.services";
import { downloadBlob } from "./invoices.utils";
import {
  stateMatches,
  stopService,
  useChildActor,
  useContext,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";
import type { Invoice, InvoicePaymentDetailsModel } from "./invoices.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.actions
 * @description Single-invoice actions — pay/retry/refresh, readiness, lifecycle,
 * the PDF download, the payment-method assignment and the pay-currency switch,
 * plus the inline 3DS challenge controls. The payment-method model is staged
 * with `input()`, then `updatePaymentDetails()` saves it.
 */
export function createInvoiceActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string,
  invoiceId: string,
  paymentFailed: Ref<boolean>,
  paymentDetailsModel: Ref<InvoicePaymentDetailsModel>
) {
  const { state, send, service } = actor;
  const invoice = useContext<Invoice | undefined>(state, "invoice");
  const payment = useChildActor(state, "payment");

  function pay(): void {
    send({ type: "PAY" });
  }

  function retry(): void {
    paymentFailed.value = false;
    send({ type: "RETRY" });
  }

  function refresh(): void {
    send({ type: "REFRESH" });
  }

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      s => stateMatches(s, ["available", "complete", "unavailable"]),
      { timeout: 30_000 }
    )
      .then(() => true)
      .catch(() => false);
  }

  function completeChallenge(data?: Record<string, unknown>): void {
    payment.value?.send({ type: "CHALLENGE_RESPONSE", data });
  }

  /**
   * Renders an inline payment challenge into the provided container.
   * Call when `meta.isRenderingChallenge` is true and the container is mounted.
   */
  function renderChallenge(container: HTMLElement): void {
    payment.value?.send({
      type: "RENDER",
      data: { container, onComplete: completeChallenge }
    });
  }

  function cancelChallenge(): void {
    payment.value?.send({ type: "CHALLENGE_CANCELLED" });
  }

  /**
   * Downloads this invoice's PDF (a credit note rides the SAME reader) and
   * saves it locally as `${invoice.number}.pdf`.
   * @throws {DetailedError} when the invoice has not loaded yet.
   * @throws {NotAuthenticatedError} when the session cannot address a client.
   */
  async function downloadPdf(): Promise<void> {
    const loaded = invoice.value;
    if (!loaded?.id) {
      throw new DetailedError(
        "Invoice not available",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }

    const blob = await downloadInvoicePdf(loaded.id);
    downloadBlob(blob, `${loaded.number}.pdf`);
  }

  /**
   * Stages the payment-method model the next `updatePaymentDetails` saves.
   * `payment_details_id: null` clears the assignment; the value is fed by the
   * selection UI (`paymentDetail`, GatewayContext.ADD), mirroring
   * `invoiceChangePaymentMethodModal.vue`.
   */
  function input(model: InvoicePaymentDetailsModel): void {
    paymentDetailsModel.value = model;
  }

  /** Saves the staged payment-method model, then re-reads the invoice. */
  async function updatePaymentDetails(): Promise<void> {
    await updateInvoicePaymentDetails(invoiceId, paymentDetailsModel.value);
    refresh();
  }

  /**
   * Changes the invoice's pay currency to the brand currency `code`. The
   * machine converts the unpaid amount (`model.summary`, `model.currencyPayment`)
   * and restarts the payment form in it; the basket is never touched. Ignored
   * unless `useMeta().hasPaymentCurrencyChoice` is true.
   */
  function setCurrency(code: string): void {
    send({ type: "SET_CURRENCY", data: { code } });
  }

  function destroy(): void {
    stopService(service);
    removeFromRegistry(scopeKey);
  }

  return {
    /** Cancels an inline payment challenge. */
    cancelChallenge,

    /** Destroys this scoped instance — stops the machine and removes it. */
    destroy,

    /** Downloads and saves this invoice's PDF as `${number}.pdf`. */
    downloadPdf,

    /** Stages the payment-method model the next `updatePaymentDetails` saves. */
    input,

    /** Resolves once the invoice machine is ready for interaction. */
    isReady,

    /** Triggers the payment flow. */
    pay,

    /** Re-fetches the invoice (e.g. after an offsite 3DS return). */
    refresh,

    /** Renders an inline payment challenge into the provided container. */
    renderChallenge,

    /** Retries a failed payment. */
    retry,

    /** Changes the pay currency; converts the unpaid amount. */
    setCurrency,

    /** Saves the staged payment-method model, then re-reads the invoice. */
    updatePaymentDetails
  };
}

// Type export for consumers
export type UseInvoiceActions = ReturnType<typeof createInvoiceActions>;
