import type { GatewayContext } from "../payment-gateways.types";

// -----------------------------------------------------------------------------
declare global {
  interface Window {
    Razorpay: new (options: {
      // Options for 'Authorization Payment' flow (different to checkout options)
      // See: https://razorpay.com/docs/api/payments/recurring-payments/cards/create-authorization-transaction/
      customer_id: string;
      key: string;
      order_id: string;
      recurring: boolean;
    }) => RazorpayInstance;
  }
}
export type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
  [key: string]: any;
};

export type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayErrorResponse = {
  error: {
    code: number;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
};

export type IRazorpaySetupDetails = {
  key_id: string;
  customer_id: string;
  order_id: string;
  callback_url: string;
};

export type RazorpayContext = GatewayContext<{
  sdk?: {
    razorpay: () => RazorpayInstance;
  };
  // gateway settings
}>;

export type RazorpayAuthResponse = {
  cancel_url: string;
  gateway_specific: {
    clientToken: string;
  };
  notify_url: string;
  return_url: string;
};
