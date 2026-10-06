import { spawn } from "xstate";
import {
  BrandConfigKeys,
  InvoiceStatus,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import {
  isCancellable,
  isDue
} from "../contract-product/contract-product.utils";
import { paymentDetailsMachine as paymentDetailMachine } from "../payment-details";
import { compact, get, includes, map, uniq } from "lodash-es";
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

// -----------------------------------------------------------------------------
// The order conditions — status rules over the raw record. Distinct from the
// meta's `isPartial` / `isComplete`, which ignore the status (ruling K6).

type InvoiceCondition = Pick<
  IInvoice,
  "status" | "paid_amount" | "unpaid_amount_converted"
>;

const CANCELLED_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CANCELLED,
  InvoiceStatus.CANCELLATION_REQUEST
];

/** True while the invoice's status is `OVERDUE`. */
export function isOverdue(invoice: Pick<IInvoice, "status">): boolean {
  return invoice.status?.code === InvoiceStatus.OVERDUE;
}

/** True while the invoice's status is `PAID`. */
export function isPaid(invoice: Pick<IInvoice, "status">): boolean {
  return invoice.status?.code === InvoiceStatus.PAID;
}

/** True while the invoice is `CANCELLED` or `CANCELLATION_REQUEST`. */
export function isCancelled(invoice: Pick<IInvoice, "status">): boolean {
  return includes(CANCELLED_STATUSES, invoice.status?.code);
}

/** True while the invoice is due and carries both an unpaid and a paid amount. */
export function isPartiallyPaid(invoice: InvoiceCondition): boolean {
  return (
    isDue(invoice) &&
    (invoice.unpaid_amount_converted ?? 0) > 0 &&
    (invoice.paid_amount ?? 0) > 0
  );
}

/** True while the invoice is due and still carries an unpaid balance. */
export function canPay(invoice: InvoiceCondition): boolean {
  return isDue(invoice) && !!(invoice.unpaid_amount_converted ?? 0);
}

/** True while the invoice is due and cancelling it still means anything. */
export function canCancel(invoice: Pick<IInvoice, "status">): boolean {
  return isCancellable(invoice) && isDue(invoice);
}

/**
 * The catalogue product ids of an order's SNAPSHOT items — the ones the item
 * image read asks for. Live items carry their product image already.
 */
export function snapshotProductIds(invoice?: IInvoice): string[] {
  return uniq(
    compact(
      map(invoice?.current_data?.content?.products, item => item.product?.id)
    )
  );
}
