// --- external
import type { ActorRef } from "xstate";

// --- types
import type { GatewayContext } from "../types";

// -----------------------------------------------------------------------------

export interface BraintreeContext extends GatewayContext {
  braintree?: any;
  elements?: any;
  element?: any;
  elementStatus?: any;
  validationObserver?: ActorRef<any>;
  clientPaymentDetailsId?: string;
  clientSecret?: string;
}
