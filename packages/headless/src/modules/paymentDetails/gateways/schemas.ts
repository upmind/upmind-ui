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
      // a helper for the ui to not show the checkboxes if the gateway does not support storing
      // ---
      can_store: {
        type: "boolean",
        const: context.canStore,
        readOnly: true
      },
      must_store: {
        type: "boolean",
        const: context.mustStore,
        readOnly: true
      },
      must_auto_pay: {
        type: "boolean",
        const: context.mustAutoPay,
        readOnly: true
      },
      //  ---
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

export const useUischema = (_context: GatewayContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/store_on_payment",
        i18n: "payment.store_on_payment",
        options: {
          autocomplete: "off"
        },
        // only show this field if we have the store_on_payment flag
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#",
            schema: {
              required: ["can_store"],
              properties: {
                can_store: { const: true },
                must_store: { not: { const: true } }
              }
            }
          }
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
                store_on_payment: { const: true },
                must_auto_pay: { not: { const: true } }
              }
            }
          }
        }
      }
    ]
  };

  return uischema as Layout;
};
