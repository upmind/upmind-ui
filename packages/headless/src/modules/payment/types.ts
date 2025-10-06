// --- external

// --- internal
import type {
  IOrder,
  IPaymentAttempt,
  Methods,
  SelectedPaymentMethod
} from "@upmind-automation/types";
import { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

export interface PaymentArgs {
  orderId: IOrder["id"];
  paymentDetail: SelectedPaymentMethod;
}

export interface PaymentContext extends PaymentArgs {
  cancel?: {
    fields: Record<string, string>;
    method: Methods;
    url: URL["href"];
  };
  approval?: {
    fields: Record<string, string>;
    method: Methods;
    url: URL["href"];
  };
  payment?: IPaymentAttempt & {};
  error?: ResponseError;
}
