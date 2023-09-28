import type { StateMachine } from "xstate";

// --------------------------------------------------------
// Contexts

export interface BrandContext {
  currencies: Array<any> | null;
  // todo add all the other types
  // ---
  error?: RequestError;
}

export interface BrandsContext {
  requests: Record<string, StateMachine>;
}

// --------------------------------------------------------
// Events

export interface BrandEvent {
  type: string;
  data: any;
  error?: RequestError;
}
