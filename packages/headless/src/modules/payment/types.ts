// --- extrnal

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// interfaces

// --------------------------------------------------------
// Contexts

export interface PaymentContext {
  id?: string;
  // TODO:
  // order?: IBasket;
  order?: any;
  paymentDetails?: Object;
  // TODO:
  // payment?: IPayment;
  payment?: any;
  urls: {
    return?: URL;
    cancel?: URL;
  };
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface PaymentEvent {
  type: "PROCESS" | "CANCEL" | "RETRY";
  // TODO:
  // data?: IPayment;
  // error?: RequestError;
  data?: any;
  error?: any;
}
