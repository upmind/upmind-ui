// --- extrnal

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

export interface StripeContext {
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface StripeEvent {
  type: "CHECKOUT";
  data?: null;
  error?: RequestError;
}
