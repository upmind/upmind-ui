// --- external
import type { ActorRef } from "xstate";
import type { Dropin } from "braintree-web-drop-in";

// --- types
import type { GatewayContext } from "../types";

// -----------------------------------------------------------------------------

export interface BraintreeContext extends GatewayContext {
  authorization?: string;
  braintree?: Dropin;
  paymentUses3DS?: boolean;
  paymentMethodPayPal?: boolean;
  // ---
  status?: any;
  validationObserver?: ActorRef<any>;
  braintreeHelper?: (callback: any) => void;
}

export enum BraintreeTypes {
  CARD = "CreditCard",
  PAYPAL = "PayPalAccount"
}
