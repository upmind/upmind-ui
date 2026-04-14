// --- external
import { spawn } from "xstate";

// --- internal
import paymentDetailMachine from "../paymentDetails/paymentDetail.machine";

// --- utils

// --- types
import type { IInvoice } from "@upmind-automation/types";
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
  rawInvoice?: IInvoice,
  lastPaymentModel?: LastPaymentModel
) {
  return spawn(
    paymentDetailMachine.withContext({
      isInvoked: true,
      orderId: rawInvoice?.id,
      orderStatus: rawInvoice?.status.code,
      currency: rawInvoice?.currency,
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
