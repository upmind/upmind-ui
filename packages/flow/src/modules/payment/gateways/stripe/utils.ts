// --- external

// --- internal

// --- utils
import { reduce, includes, find } from "lodash-es";

// --- types
import type { IGateway } from "../../types.d";
import { STRIPE_PAYMENT_METHOD_TYPES } from "./services";

// --------------------------------------------------------

export function getSupportedPaymentMethods(gateway: IGateway) {
  return reduce(
    gateway.gateway_settings,
    (result: STRIPE_PAYMENT_METHOD_TYPES[], setting) => {
      result ??= [];

      debugger;
      if (
        includes(["paymentMethodCard", "paymentMethodPayPal"], setting.field) &&
        setting.value === "1"
      ) {
        debugger;
        switch (setting.field) {
          case "paymentMethodCard":
            result.push(STRIPE_PAYMENT_METHOD_TYPES.CARD);
            break;
          case "paymentMethodPayPal":
            result.push(STRIPE_PAYMENT_METHOD_TYPES.PAYPAL);
            break;
        }
      }
      return result;
    },
    []
  );
}

/**
 * @name stripe_publicKey
 * @desc Here we get the Stripe publicKey from the gateway settings.
 */
export function getPublicKey(gateway: IGateway) {
  const setting = find(gateway?.gateway_settings || [], ["field", "publicKey"]);
  return setting?.value;
}
