// --- external

// --- internal

// --- utils

// --- types
import { QUERY_PARAMS } from "@upmind-automation/types";
import type { GatewayContext } from "./types";
import type { Layout } from "@jsonforms/core";
import { generateResponseUrls } from "./utils";

// -----------------------------------------------------------------------------

export const useSchema = (context: GatewayContext) => {
  const { cancel, success, fail } = generateResponseUrls(
    window.location.origin,
    context
  );
  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: ["gateway_id"],
    properties: {
      gateway_id: {
        type: "string",
        title: "Gateway ID",
        const: context?.gateway?.id,
        readOnly: true
      },
      store_on_payment: {
        type: "boolean",
        default: context.canStore,
        readOnly: context.canStore == false
      },
      store_on_payment_auto_payment: {
        type: "boolean",
        title: "",
        description: "",
        default: context.canStore,
        readOnly: context.canStore == false
      },
      return_url: {
        type: "string",
        title: "Return URL",
        format: "uri-reference",
        readOnly: true,
        const: `?${QUERY_PARAMS.SUCCESS}=${encodeURIComponent(success)}&${QUERY_PARAMS.FAILED}=${encodeURIComponent(fail)}`
      },
      cancel_url: {
        type: "string",
        title: "Cancel URL",
        format: "uri",
        readOnly: true,
        const: cancel
      }
    }
  };

  return schema;
};

export const useUischema = (context: GatewayContext) => {
  const showStoreElements = context.canStore && !context.mustStore;

  const uischema = {
    type: "VerticalLayout",
    elements: !showStoreElements
      ? []
      : [
          {
            type: "Control",
            scope: "#/properties/store_on_payment",
            i18n: "payment.store_on_payment",
            options: {
              autocomplete: "off"
            }
          },
          {
            type: "Control",
            scope: "#/properties/store_on_payment_auto_payment",
            i18n: "payment.store_on_payment_auto_payment",
            options: {
              autocomplete: "off"
            },
            // only show this field if we have the store_on_payment flag
            rule: {
              effect: "SHOW",
              condition: {
                scope: "#",
                schema: {
                  required: ["store_on_payment"],
                  properties: {
                    store_on_payment: { const: true }
                  }
                }
              }
            }
          }
        ]
  };

  return uischema as Layout;
};
