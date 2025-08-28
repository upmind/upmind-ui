// --- external

// --- internal

// --- utils

import { reduce, includes, find } from "lodash-es";

// --- types
import type { IGateway } from "@upmind-automation/types";
import { STRIPE_PAYMENT_METHOD_TYPES } from "./types";

// -----------------------------------------------------------------------------

export function getSupportedPaymentMethods(gateway?: IGateway) {
  if (!gateway) return [];

  return reduce(
    gateway.gateway_settings,
    (result: STRIPE_PAYMENT_METHOD_TYPES[], setting) => {
      result ??= [];

      if (
        includes(["paymentMethodCard", "paymentMethodPayPal"], setting.field) &&
        setting.value === "1"
      ) {
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
 * @name braintree_publicKey
 * @desc Here we get the Braintree publicKey from the gateway settings.
 */
export function getPublicKey(gateway?: IGateway) {
  const setting = find(gateway?.gateway_settings || [], ["field", "publicKey"]);
  return setting?.value;
}
