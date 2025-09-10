// --- external

// --- internal

// --- utils
import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema
} from "../schemas";
import { get } from "lodash-es";

// --- types
import type { IGatewayProvider } from "@upmind-automation/types";
import type { GatewayContext } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = (context: GatewayContext) => {
  const gateway_provider = get(
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
        required: [
          "card_number",
          "holder_name",
          "expiration_year",
          "expiration_month",
          "cvv2"
        ],
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
          expiration_year: {
            type: "string",
            minLength: 2,
            maxLength: 2,
            // Pattern matches two digits, as extracted from MM/YYYY or MM/YY formats
            pattern: "^\\d{2}$",
            title: "Expiration Year"
            // description:
            //   "Last two digits of the year, extracted from MM/YYYY or MM/YY"
          },
          expiration_month: {
            type: "string",
            minLength: 2,
            maxLength: 2,
            // Pattern matches two digits for month (01-12)
            pattern: "^(0[1-9]|1[0-2])$",
            title: "Expiration Month"
            // description: "Two digit month, extracted from MM/YYYY or MM/YY"
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
        i18n: "form.card_holder_name",
        options: {
          autocomplete: "cc-name"
        }
      },
      {
        type: "Control",
        scope: "#/properties/openpay/properties/card_number",
        i18n: "form.card_num",
        options: {
          autocomplete: "cc-number"
        }
      },
      {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/openpay/properties/expiration_month",
            i18n: "form.card_expiry_month",
            options: {
              autocomplete: "cc-exp-month",
              trim: true,
              placeholder: "MM"
            }
          },
          {
            type: "Control",
            scope: "#/properties/openpay/properties/expiration_year",
            i18n: "form.card_expiry_year",
            options: {
              autocomplete: "cc-exp-year",
              trim: true,
              placeholder: "YY"
            }
          },
          {
            type: "Control",
            scope: "#/properties/openpay/properties/cvv2",
            i18n: "form.card_cvv",
            options: {
              autocomplete: "cc-csc",
              trim: true
            }
          }
        ]
      },
      ...(defaultUischema?.elements || [])
    ]
  };

  return uischema as UISchemaElement;
};
