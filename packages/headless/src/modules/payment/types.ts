// --- external

// --- internal
import type {
  IBasket,
  IOrder,
  IPaymentDetail,
  IPaymentAttempt,
  Methods,
  IClient,
  ICurrency,
  IAddress,
} from "@upmind-automation/types";
import { QueryResponseError } from "../query";
import { ErrorObject } from "ajv";

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
  error?: QueryResponseError | ErrorObject[];
}
