// --- external
import type { ActorRef } from "xstate";

// --- types
import type { GatewayContext } from "../types";

// -----------------------------------------------------------------------------

export interface BraintreeContext extends GatewayContext {
  authorization?: string;
  braintree?: any;
  paymentUses3DS?: boolean;
  paymentMethodPayPal?: boolean;
}
