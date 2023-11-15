// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface SystemContext {
  currencies: Array<any> | null;
  billingCycles: Array<any> | null;
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface SystemEvent {
  type: string;
  data: any;
  error?: RequestError;
}
