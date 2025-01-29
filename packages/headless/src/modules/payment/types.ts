// --- extrnal

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
  paymentDetails?: Object;
  payment?: any; //IPayment
  urls: {
    return?: URL;
    cancel?: URL;
  };
  error?: any;
}

// --------------------------------------------------------
// Events

export interface PaymentEvent {
  type: "PROCESS" | "CANCEL" | "RETRY";
  data?: any; //IPayment
  error?: any;
}
