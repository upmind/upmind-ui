// --- external

// --- internal
import type { IBasket } from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// interfaces

// --------------------------------------------------------
// Contexts

export interface PaymentContext {
  id?: string;
  order?: IBasket;
  paymentDetails?: any;
  payment?: any; //IPayment
  urls?: {
    return?: URL;
    cancel?: URL;
  };
  error?: any;
}
