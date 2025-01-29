// --- extrnal

// --- types

import type { GatewayContext } from "../types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

export interface StripeContext extends GatewayContext {
  stripe?: any;
}

// --------------------------------------------------------
// Events

export interface StripeEvent {
  type: "CHECKOUT";
  data?: any;
  error?: any;
}
