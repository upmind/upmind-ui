// --- external

// --- internal
import type {
  IOrder,
  IPaymentDetail,
  IPaymentAttempt,
  Methods,
  IClient,
  ICurrency,
  IAddress,
} from "@upmind-automation/types";
import { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

export interface PaymentArgs {
  orderId: IOrder["id"];
  clientId: IClient["id"];
  currency: ICurrency;
  address: IAddress;
  paymentDetail: IPaymentDetail;
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
