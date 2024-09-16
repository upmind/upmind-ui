// --- extrnal

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
  payment?: IPayment;
  urls: {
    return?: URL;
    cancel?: URL;
  };
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface PaymentEvent {
  type: "PROCESS" | "CANCEL" | "RETRY";
  data?: IPayment;
  error?: RequestError;
}
