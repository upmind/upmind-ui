// --- external

// --- internal

// --- utils
import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema,
} from "../utils";

import { reduce, includes, find } from "lodash-es";

// --- types
import type { IGateway } from "../types";
import type { StripeContext } from "./types";
import { STRIPE_PAYMENT_METHOD_TYPES } from "./services";
import type { UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = (context: StripeContext) => {
  const defaultSchema = useDefaultSchema(context as any);

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: [
      ...(defaultSchema?.required || []), // NB Always include the default schema required fields
    ],

    properties: {
      ...(defaultSchema?.properties || {}), // NB Always include the default schema properties
    },
  };

  return schema;
};

// --------------------------------------------------------

export const useUischema = (_context: StripeContext) => {
  const defaultUischema = useDefaultUischema();

  const uischema = {
    type: "VerticalLayout",
    elements: [
      ...(defaultUischema?.elements || []), // NB Always append the default uischema elements
    ],
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------

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
 * @name stripe_publicKey
 * @desc Here we get the Stripe publicKey from the gateway settings.
 */
export function getPublicKey(gateway?: IGateway) {
  const setting = find(gateway?.gateway_settings || [], ["field", "publicKey"]);
  return setting?.value;
}
