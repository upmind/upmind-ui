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
