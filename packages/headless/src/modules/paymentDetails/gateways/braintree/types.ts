// --- external
import type { ActorRef } from "xstate";
import type { Dropin } from "braintree-web-drop-in";

// --- types
import type { GatewayContext } from "../types";

// -----------------------------------------------------------------------------

export type BraintreeContext = GatewayContext<{
  sdk?: {
    authorization: string;
    braintree: Dropin;
    paymentUses3DS: boolean;
    paymentMethodPayPal: boolean;
  };
}>;

export enum BraintreeTypes {
  CARD = "CreditCard",
  PAYPAL = "PayPalAccount"
}
