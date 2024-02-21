// --- external

// --- internal

// --- utils
import { reduce, defaultsDeep, get, set } from "lodash-es";

// --- types
import type { GatewayContext } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export const useSchema = ({ gateway }: GatewayContext) => {
  const gateway_provider = get(gateway, "gateway_provider", {});

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: ["card_num", "card_expiry", "card_cvv"],
    properties: {
      cardholder_name: { type: "string", title: "Cardholder Name" },
      card_num: {
        type: "string",
        title: "Card Number",
        description: "The 16 digit number on the front of your card.",
        minLength: 0,
        maxLength: 22,
        pattern: "[0-9]*"
      },
      card_expiry: {
        type: "string",
        description: 'Expiry Date of the card. Date Format: MM/YY"',
        title: "Expiry Date",
        pattern: "^(0[1-9]|1[0-2])/[0-9]{2}$"
      },
      card_cvv: {
        type: "string",
        title: "CVV",
        description:
          "card security code found on the back of your card that provides an additional measure of credit card security.",
        pattern: "^[0-9]*$",
        minLength: 3,
        maxLength: 5
      }, // TODO: get from gateway card type cvv_length
      external: {
        type: "boolean",
        title: "Use external payment gateway",
        const: false
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
      }
    }
  };

  // conditionally add the cardholder_name to the required fields
  if (gateway_provider?.requires_name) {
    schema.required.push("cardholder_name");
  }

  return schema;
};

// --------------------------------------------------------

export const useUischema = (_context: GatewayContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/cardholder_name",
        options: {
          autocomplete: "cc-name"
        },
        // only show this field if its in the required fields
        // as NOT ALL gateways require the cardholder_name
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#/required",
            schema: { enum: ["cardholder_name"] }
          }
        }
      },
      {
        type: "Control",
        scope: "#/properties/card_num",
        options: {
          autocomplete: "cc-number"
        }
      },
      {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/card_expiry",
            options: {
              autocomplete: "cc-exp",
              trim: true
            }
          },
          {
            type: "Control",
            scope: "#/properties/card_cvv",
            options: {
              autocomplete: "cc-csc",
              trim: true
            }
          }
        ]
      },
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
