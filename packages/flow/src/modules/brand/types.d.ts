// --------------------------------------------------------
// Contexts

export interface BrandContext {
  currencies: Array<any> | null;
  // todo add all the other types
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface BrandEvent {
  type: string;
  data: any;
  error?: RequestError;
}
