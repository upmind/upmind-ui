// --- external
import { spawn } from "xstate";

// --- internal
import paymentDetailMachine from "../paymentDetails/paymentDetail.machine";

// --- utils
import { mapIClient } from "../session/utils";
import { mapIAddress } from "../client/address/mappers";
import { mapICurrency } from "../currency/mappers";

// --- types
import type { Invoice } from "../invoices/types";
import type { PaymentDetailsContext } from "../paymentDetails/types";
import type { LastPaymentModel } from "./order.types";

// -----------------------------------------------------------------------------
/**
 * @module orders/order.utils
 * @description Utilities for the order payment orchestrator machine.
 */

/**
 * Spawns a paymentDetail child actor configured for an invoice payment.
 * Optionally seeds it with previous selections for retry/partial UX.
 *
 * Because the machine is SPAWNED (not standalone interpreted), sendParent
 * works correctly — providePaymentDetails sends PAYMENT_DETAILS and
 * cancelPaymentDetails sends CANCEL to the parent order machine.
 */
export function spawnOrderPaymentDetail(
  invoice: Invoice,
  lastPaymentModel?: LastPaymentModel
) {
  return spawn(
    paymentDetailMachine.withContext({
      orderId: invoice.id,
      orderStatus: invoice.status,
      currency: mapICurrency(invoice.currency),
      address: invoice.address ? mapIAddress(invoice.address) : undefined,
      client: mapIClient(invoice.client),
      amount: invoice.summary.unpaidAmountConverted || 0.0,
      paidAmount: invoice.summary.paidAmount,
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
