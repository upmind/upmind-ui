// --- external

// --- internal
import type {
  IOrder,
  IPaymentAttempt,
  Methods
} from "@upmind-automation/types";
import { ResponseError } from "../../utils";
import { PaymentDetailData } from "../paymentDetails";

// -----------------------------------------------------------------------------

export interface PaymentArgs {
  orderId: IOrder["id"];
  paymentDetail: PaymentDetailData;
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
