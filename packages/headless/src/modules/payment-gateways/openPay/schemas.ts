import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema
} from "../payment-gateways.schemas";
import { get } from "lodash-es";
import type { GatewayContext } from "../payment-gateways.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { IGatewayProvider } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export const useSchema = (context: GatewayContext) => {
  const _gateway_provider = get(
    context.gateway,
    "gateway_provider",
    {}
  ) as IGatewayProvider;

  const defaultSchema = useDefaultSchema(context);

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: [...(defaultSchema?.required || []), "openpay"],
    properties: {
      ...(defaultSchema?.properties || {}),
      openpay: {
        type: "object",
        title: "OpenPay Payment Details",
        required: ["card_number", "holder_name", "expiration_date", "cvv2"],
        properties: {
          card_number: {
            type: "string",
            minLength: 13,
            maxLength: 22,
            pattern: "^[0-9]*$",
            title: "Card Number"
          },
          holder_name: {
            type: "string",
            title: "Cardholder Name"
          },

          expiration_date: {
            type: "string",
            minLength: 5,
            maxLength: 5,
            // Pattern matches two digits, as extracted from MM/YYYY or MM/YY formats
            pattern: "^(0[1-9]|1[0-2])/[0-9]{2}$"
          },

          cvv2: {
            type: "string",
            minLength: 3,
            maxLength: 5,
            pattern: "^[0-9]*$",
            title: "CVV2"
          }
        }
      }
    }
  };

  // Optionally, if OpenPay requires holder_name, ensure it's required (already included above)
  // If you want to conditionally require holder_name, you can adjust here

  return schema as JsonSchema;
};

// TODO: export const useUischema = (context: GatewayContext) => {
// TODO: const defaultUischema = useDefaultUischema(context);
export const useUischema = (context: GatewayContext) => {
  const defaultUischema = useDefaultUischema(context);

  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/openpay/properties/holder_name",
        i18n: "form.cardholder_name",
        options: {
          autocomplete: "cc-name"
        }
      },
      {
        type: "Control",
        scope: "#/properties/openpay/properties/card_number",
        i18n: "form.card_num",
        options: {
          autocomplete: "cc-number",
          mask: /^[0-9]*$/
        }
      },
      {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/openpay/properties/expiration_date",
            i18n: "form.card_expiry",
            options: {
              autocomplete: "cc-exp-month",
              trim: true,
              placeholder: "MM/YY",
              mask: "00/00"
            }
          },

          {
            type: "Control",
            scope: "#/properties/openpay/properties/cvv2",
            i18n: "form.card_cvv",
            options: {
              autocomplete: "cc-csc",
              trim: true,
              mask: /^[0-9]*$/
            }
          }
        ]
      },
      ...(defaultUischema?.elements || [])
    ]
  };

  return uischema as UISchemaElement;
};
