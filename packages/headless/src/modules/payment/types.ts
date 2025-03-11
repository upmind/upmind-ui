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
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// interfaces
export interface PaymentArgs {
  orderId: IOrder["id"];
  clientId: IClient["id"];
  currency: ICurrency;
  address: IAddress;
  paymentDetail: IPaymentDetail;
}
// --------------------------------------------------------
// Contexts

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
  error?: any;
}
