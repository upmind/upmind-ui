// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface BrandContext {
  // TODO: add all the other types
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
