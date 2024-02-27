// --- external

// --- internal

// --- utils
import { generateUrls } from "../utils";
import { reduce, includes, find } from "lodash-es";

// --- types
import { QUERY_PARAMS } from "../types.d";
import type { IGateway } from "../types.d";
import type { StripeContext } from "./types.d";
import { STRIPE_PAYMENT_METHOD_TYPES } from "./services";
import type { UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({ gateway, operation_id }: StripeContext) => {
  const { cancel, successsEncoded, failEncoded } = generateUrls(operation_id);

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: ["gateway_id"],
    properties: {
      gateway_id: {
        type: "string",
        title: "Gateway ID",
        const: gateway.id
      },
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
      },
      return_url: {
        type: "string",
        title: "Return URL",
        format: "uri-reference",
        const: `?${QUERY_PARAMS.SUCCESS}=${successsEncoded}&${QUERY_PARAMS.FAILED}=${failEncoded}`
      },
      cancel_url: {
        type: "string",
        title: "Cancel URL",
        format: "uri",
        const: cancel
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
