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
      canStore: {
        type: "boolean",
        const: context.canStore,
        readOnly: true
      },
      mustStore: {
        type: "boolean",
        const: context.mustStore,
        readOnly: true
      },
      mustAutoPay: {
        type: "boolean",
        const: context.mustAutoPay,
        readOnly: true
      },
      //  ---
      storeOnPayment: {
        type: "boolean",
        default: context.canStore,
        readOnly: context.canStore == false
      },
      storeOnPayment_auto_payment: {
        type: "boolean",
        title: "",
        description: "",
        default: context.canStore,
        readOnly: context.canStore == false
      },
      returnUrl: {
        type: "string",
        title: "Return URL",
        format: "uri-reference",
        readOnly: true,
        const: `?${QUERY_PARAMS.SUCCESS}=${encodeURIComponent(success)}&${QUERY_PARAMS.FAILED}=${encodeURIComponent(fail)}`
      },
      cancelUrl: {
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
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/storeOnPayment",
        i18n: "form.storeOnPayment",
        options: {
          autocomplete: "off"
        },
        // only show this field if we have the storeOnPayment flag
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#",
            schema: {
              required: ["canStore"],
              properties: {
                canStore: { const: true },
                mustStore: { not: { const: true } }
              }
            }
          }
        }
      },
      {
        type: "Control",
        scope: "#/properties/storeOnPayment_auto_payment",
        i18n: "form.allow_auto_payment",
        options: {
          autocomplete: "off"
        },
        // only show this field if we have the storeOnPayment flag
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#",
            schema: {
              required: ["storeOnPayment"],
              properties: {
                storeOnPayment: { const: true },
                mustAutoPay: { not: { const: true } }
              }
            }
          }
        }
      }
    ]
  };

  return uischema as Layout;
};
