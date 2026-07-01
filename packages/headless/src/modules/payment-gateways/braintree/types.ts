import type { GatewayContext } from "../payment-gateways.types";
import type { Dropin } from "braintree-web-drop-in";

// --- types

// -----------------------------------------------------------------------------

export enum BraintreeTypes {
  CARD = "CreditCard",
  PAYPAL = "PayPalAccount"
}

export type BraintreeResponse = {
  cancel_url: string;
  gateway_specific: {
    clientToken: string;
  };
  notify_url: string;
  return_url: string;
};

export type BraintreeContext = GatewayContext<{
  sdk?: {
    authorization: string;
    braintree: Dropin;
  };
  // gateway settings
  paymentUses3DS?: boolean;
  paymentMethodPayPal?: boolean;
}>;
