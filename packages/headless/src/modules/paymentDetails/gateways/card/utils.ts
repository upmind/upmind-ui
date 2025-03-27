// --- external

// --- internal

// --- utils
import {
  useSchema as useDefaultSchema,
  useUischema as useDefaultUischema,
} from "../utils";
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
    required: [
      ...(defaultSchema?.required || []), // NB Always include the default schema required fields
      "card_num",
      "card_expiry",
      "card_cvv",
    ],
    properties: {
      ...(defaultSchema?.properties || {}), // NB Always include the default schema properties

      cardholder_name: { type: "string" },
      card_num: {
        type: "string",
        minLength: 0,
        maxLength: 22,
        pattern: "[0-9]*",
      },
      card_expiry: {
        type: "string",
        title: "Expiry Date",
        pattern: "^(0[1-9]|1[0-2])/[0-9]{2}$",
      },
      card_cvv: {
        type: "string",
        pattern: "^[0-9]*$",
        minLength: 3,
        maxLength: 5,
      }, // TODO: get from gateway card type cvv_length
      external: {
        type: "boolean",
        const: false,
      },
    },
  };

  // conditionally add the cardholder_name to the required fields
  if (gateway_provider?.requires_name) {
    schema.required.push("cardholder_name");
  }

  return schema as JsonSchema;
};

// TODO: export const useUischema = (context: GatewayContext) => {
// TODO: const defaultUischema = useDefaultUischema(context);
export const useUischema = () => {
  const defaultUischema = useDefaultUischema();

  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/cardholder_name",
        i18n: "payment.cardholder_name",
        options: {
          autocomplete: "cc-name",
        },
        // only show this field if its in the required fields
        // as NOT ALL gateways require the cardholder_name
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#/required",
            schema: { enum: ["cardholder_name"] },
          },
        },
      },
      {
        type: "Control",
        scope: "#/properties/card_num",
        i18n: "payment.card_num",
        options: {
          autocomplete: "cc-number",
        },
      },
      {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/card_expiry",
            i18n: "payment.card_expiry",
            options: {
              autocomplete: "cc-exp",
              trim: true,
            },
          },
          {
            type: "Control",
            scope: "#/properties/card_cvv",
            i18n: "payment.card_cvv",
            options: {
              autocomplete: "cc-csc",
              trim: true,
            },
          },
        ],
      },
      ...(defaultUischema?.elements || []), // NB Always append the default uischema elements
    ],
  };

  return uischema as UISchemaElement;
};
