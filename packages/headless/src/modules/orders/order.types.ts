import type { ResponseError } from "../../utils";
import type { Invoice } from "../invoices/invoices.types";
import type { PaymentDetailData, PaymentDetailModel } from "../payment-details";
import type { IInvoice } from "@upmind-automation/types";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

/**
 * @module orders/order.types
 * @description Types for the order payment orchestrator machine.
 */

/**
 * Persisted payment selections for retry/partial payment UX.
 * These values seed the paymentDetail machine on re-spawn
 * so the user sees their previous choices pre-filled.
 */
export type LastPaymentModel = Pick<
  PaymentDetailModel,
  "amount" | "gateway_id" | "wallet_amount"
>;

/**
 * Context for the order payment orchestrator machine.
 */
export type OrderContext = {
  /** The invoice ID being paid. */
  invoiceId: string;

  /** Spawned auth subscription actor. */
  authHelper?: ActorRef<any>;

  /** The raw IInvoice API response. */
  rawInvoice?: IInvoice;

  /** The parsed invoice data. */
  invoice?: Invoice;

  /** Spawned paymentDetail child actor. */
  paymentDetailActor?: ActorRef<any>;

  /** The resolved payment detail data from the paymentDetail machine. */
  paymentDetail?: PaymentDetailData;

  /** Persisted payment selections for retry/partial UX. */
  lastPaymentModel?: LastPaymentModel;

  /** Error from the last operation. */
  error?: ResponseError;
};
