// --- external

// --- internal
import type {
  IOrder,
  IPaymentAttempt,
  Methods,
  SelectPaymentMethodData
} from "@upmind-automation/types";
import { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

export interface PaymentArgs {
  orderId: IOrder["id"];
  paymentDetail: SelectPaymentMethodData;
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
