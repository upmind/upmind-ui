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
    {
      orderId: context.orderId,
      autoPay: context?.model?.storeOnPaymentAutoPayment,
      externalPayment: context?.gateway?.gateway_provider?.external_payment,
      type: context?.type
    }
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
      storeOnPaymentAutoPayment: {
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
        i18n: "form.store_on_payment",
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
        scope: "#/properties/storeOnPaymentAutoPayment",
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
