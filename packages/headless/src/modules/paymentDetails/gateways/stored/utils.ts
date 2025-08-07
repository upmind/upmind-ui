// --- external

// --- internal

// --- utils
import { generateResponseUrls } from "../utils";
import { map } from "lodash-es";

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";
import type { GatewayContext } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useSchema = (context: GatewayContext) => {
  const { cancel, success, fail } = generateResponseUrls(
    window.location.origin,
    context
  );

  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: ["payment_details_id"],
    properties: {
      payment_details_id: {
        type: ["string", "null"],
        title: "Select one of your stored payment methods",
        options: map(
          context.stored_payment_methods,
          ({ id, name, card_type, card_expire_date }) => {
            return {
              value: id,
              label: name,
              text: `Exp ${card_expire_date}`,
              appendIcon: { name: card_type, path: "payment-providers" }
            };
          }
        ),
        enum: !context.stored_payment_methods?.length
          ? undefined
          : map(context.stored_payment_methods, "id")
      },
      return_url: {
        type: "string",
        title: "Return URL",
        format: "uri-reference",
        const: `?${QUERY_PARAMS.SUCCESS}=${encodeURIComponent(success)}&${QUERY_PARAMS.FAILED}=${encodeURIComponent(fail)}`
      },
      cancel_url: {
        type: "string",
        title: "Cancel URL",
        format: "uri",
        const: cancel
      }
    }
  };

  return schema as JsonSchema;
};

export const useUischema = ({ stored_payment_methods }: GatewayContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/payment_details_id",
        i18n: "payment.payment_details_id",
        options: {
          format: "radio"
        }
      }
    ]
  };

  return uischema as UISchemaElement;
};
