import type { StateMachine } from "xstate";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface BasketContext {
  debug: boolean;
  basket: Basket;
  error?: RequestError;
}

export interface Basket {}

// --------------------------------------------------------
// Events

export interface BasketEvents {
  type: "CHECK" | "REFRESH";
  payload?: any;
}
