// --- extrnal

// --- internal
import type { Basket } from "../basket/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// interfaces

// --------------------------------------------------------
// Contexts

export interface PaymentContext {
  id?: string;
  order?: Basket;
  paymentDetails?: object;
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
