import { spawn } from "xstate";
import { BrandConfigKeys, InvoiceStatusGroups } from "@upmind-automation/types";
import { paymentDetailsMachine as paymentDetailMachine } from "../payment-details";
import { get, includes } from "lodash-es";
import type {
  Invoice,
  InvoiceBrandConfig,
  LastPaymentModel
} from "./invoices.types";
import type { PaymentDetailsContext } from "../payment-details/payment-details.types";
import type { IInvoice } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module invoices/invoice.utils
 * @description Utilities for the single-invoice payment orchestrator machine.
 */

/**
 * Spawns a paymentDetail child actor configured for an invoice payment.
 * Optionally seeds it with previous selections for retry/partial UX.
 *
 * Because the machine is SPAWNED (not standalone interpreted), sendParent
 * works correctly — providePaymentDetails sends PAYMENT_DETAILS and
 * cancelPaymentDetails sends CANCEL to the parent invoice machine.
 */
export function spawnInvoicePaymentDetail(
  rawInvoice?: IInvoice,
  lastPaymentModel?: LastPaymentModel
) {
  return spawn(
    paymentDetailMachine.withContext({
      isInvoked: true,
      orderId: rawInvoice?.id,
      orderStatus: rawInvoice?.status.code,
      currency: rawInvoice?.payment_currency ?? rawInvoice?.currency,
      address: rawInvoice?.address,
      client: rawInvoice?.client,
      amount: rawInvoice?.unpaid_amount_converted || 0.0,
      paidAmount: rawInvoice?.paid_amount || 0.0,
      amountPartial: lastPaymentModel?.amount,
      model: lastPaymentModel
        ? {
            gateway_id: lastPaymentModel.gateway_id,
            wallet_amount: lastPaymentModel.wallet_amount
          }
        : {}
    } as PaymentDetailsContext),
    { name: "orderPaymentDetail", sync: true }
  );
}

/**
 * True when the brand allows a different pay currency and the invoice owes its
 * whole amount — not paid, not free, no partial payment
 * (`invoicePaymentModal.vue:176-183`).
 */
export function canChangePaymentCurrency(
  config?: InvoiceBrandConfig,
  invoice?: Invoice
): boolean {
  return (
    !!get(config, BrandConfigKeys.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED) &&
    !!invoice &&
    !includes(InvoiceStatusGroups.PAID, invoice.status) &&
    (invoice.summary.paidAmount ?? 0) === 0 &&
    (invoice.summary.unpaidAmount ?? 0) > 0
  );
}
