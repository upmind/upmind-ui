// --- external

// --- internal

// --- utils
import { reduce, includes, find, defaultsDeep, get, set } from "lodash-es";

// --- types
import type { StripeContext } from "./types.d";
import type { IGateway } from "../../../payment/types.d";
import { STRIPE_PAYMENT_METHOD_TYPES } from "./services";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = (_context: StripeContext) => {
  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: [],
    properties: {
      store: {
        type: "boolean",
        title: "Save payment details",
        default: false // todo use brand settings
      },
      auto_payment: {
        type: "boolean",
        title: "Allow auto payment",
        description:
          "Allow this payment method to be used for making automated offline payments – such as paying a renewal invoice.",
        default: false // todo use brand settings
      }
    }
  };

  return schema;
};

// --------------------------------------------------------

export const useUischema = (_context: StripeContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/store"
      },
      {
        type: "Control",
        scope: "#/properties/auto_payment"
      }
    ]
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------

export const useModelParser = (schema: JsonSchema, values) => {
  const model = reduce(
    schema?.properties,
    (result, field, key) => {
      const value = get(values, key, field?.const || field?.default);
      set(result, key, value);
      return result;
    },
    {}
  );

  return defaultsDeep(model, values);
};

// --------------------------------------------------------

export function getSupportedPaymentMethods(gateway: IGateway) {
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
export function getPublicKey(gateway: IGateway) {
  const setting = find(gateway?.gateway_settings || [], ["field", "publicKey"]);
  return setting?.value;
}
