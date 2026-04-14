// --- external
import type { ActorRef } from "xstate";

// --- internal
import type {
  IGateway,
  IInvoice,
  IOrder,
  IPaymentAttempt,
  Methods
} from "@upmind-automation/types";
import { type ResponseError } from "../../utils";
import { type PaymentDetailData } from "../paymentDetails";

// -----------------------------------------------------------------------------

/**
 * Interface representing the arguments required to initiate a payment.
 * These details are essential for processing a transaction.
 */
export interface PaymentArgs {
  /**
   * The unique identifier of the order for which the payment is being made.
   */
  orderId: IOrder["id"];
  paymentDetail: PaymentDetailData;
}

/**
 * Interface representing the context for a payment operation, typically managed by an XState machine.
 * It extends {@link PaymentArgs} with additional details for handling payment cancellations,
 * approvals, and tracking the payment attempt itself.
 */
export interface PaymentContext extends PaymentArgs {
  /**
   * Spawned auth subscription actor.
   */
  authHelper?: ActorRef<any>;
  /**
   * Optional details for handling payment cancellation, e.g. for 3D Secure redirects.
   */
  cancel?: {
    /** Key-value pairs of form fields required for cancellation. */
    fields: Record<string, string>;
    /** The HTTP method to use for the cancellation request. */
    method: Methods;
    /** The URL to which the cancellation request should be sent. */
    url: URL["href"];
  };
  /**
   * Optional details for handling payment approval, e.g. for 3D Secure redirects.
   */
  approval?: {
    /** Key-value pairs of form fields required for approval. */
    fields: Record<string, string>;
    /** The HTTP method to use for the approval request. */
    method: Methods;
    /** The URL to which the approval request should be sent. */
    url: URL["href"];
  };
  /**
   * The {@link IPaymentAttempt} object representing the current status and details of the payment attempt.
   */
  payment?: IPaymentAttempt & {};
  /**
   * The {@link IGateway} used for this payment, fetched during load via paymentDetail.gateway_id.
   * Includes gateway_provider relation for determining challenge renderer.
   */
  gateway?: IGateway;

  rawOrder?: IInvoice;
  /**
   * An error object if any issue occurred during the payment process.
   */
  error?: ResponseError;
}
