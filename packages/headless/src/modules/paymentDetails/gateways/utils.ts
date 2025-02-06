// --- external

// --- internal

// --- utils

// --- types
import { QUERY_PARAMS } from "./types";
import { GatewayStoreType } from "./types";
import type { GatewayContext, IGateway } from "./types";
import type { UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export function generateResponseUrls(
  url: string,
  { gateway, basketId, type, model }: GatewayContext
) {
  // TODO: implemet operations machine
  // if (operation_id)
  //   url.searchParams.append(QUERY_PARAMS.OPERATION_ID, operation_id || "");

  // ---
  const successUrl = new URL(`order/${basketId}`, url);
  // successUrl.searchParams.append("invoiceId", basketId);
  successUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "true");

  // ---
  const failUrl = new URL(`order/${basketId}`, url);
  // failUrl.searchParams.append("invoiceId", basketId);
  failUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "false");

  // ---
  const cancelUrl = new URL(`order/${basketId}`, url);
  // cancelUrl.searchParams.append("invoiceId", basketId);
  // cancelUrl.searchParams.append(QUERY_PARAMS.ORDER_ID, basketId);
  cancelUrl.searchParams.append(
    QUERY_PARAMS.AUTO_PAY,
    encodeURIComponent(
      btoa(JSON.stringify(model?.store_on_payment_auto_payment))
    )
  );

  cancelUrl.searchParams.append(
    QUERY_PARAMS.INIT_PAY,
    encodeURIComponent(
      btoa(
        JSON.stringify(
          gateway?.gateway_provider?.external_payment
            ? { invoiceId: basketId }
            : undefined
        )
      )
    )
  );

  // @ts-ignore
  cancelUrl.searchParams.append(QUERY_PARAMS.PAYMENT_METHOD_TYPE, type);

  // --------------------------------------------------------
  return {
    cancel: cancelUrl.toString(),
    success: successUrl.toString(),
    fail: failUrl.toString(),
  };
}

// --------------------------------------------------------

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
        // @ts-ignore
        const: context.gateway.id,
        readOnly: true,
      },
      // a helper for the ui to not show the checkboxes if the gateway does not support storing
      // ---
      can_store: {
        type: "boolean",
        const: context.can_store,
        readOnly: true,
      },
      must_store: {
        type: "boolean",
        const: context.must_store,
        readOnly: true,
      },
      must_auto_pay: {
        type: "boolean",
        const: context.must_auto_pay,
        readOnly: true,
      },
      //  ---
      store_on_payment: {
        type: "boolean",
        default: context.can_store,
        readOnly: context.can_store == false,
      },
      store_on_payment_auto_payment: {
        type: "boolean",
        title: "",
        description: "",
        default: context.can_store,
        readOnly: context.can_store == false,
      },
      return_url: {
        type: "string",
        title: "Return URL",
        format: "uri-reference",
        readOnly: true,
        const: `?${QUERY_PARAMS.SUCCESS}=${encodeURIComponent(success)}&${QUERY_PARAMS.FAILED}=${encodeURIComponent(fail)}`,
      },
      cancel_url: {
        type: "string",
        title: "Cancel URL",
        format: "uri",
        readOnly: true,
        const: cancel,
      },
    },
  };

  return schema;
};

// --------------------------------------------------------

export const useUischema = () => {
  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/store_on_payment",
        i18n: "payment.store_on_payment",
        options: {
          autocomplete: "off",
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
                must_store: { not: { const: true } },
              },
            },
          },
        },
      },
      {
        type: "Control",
        scope: "#/properties/store_on_payment_auto_payment",
        i18n: "payment.store_on_payment_auto_payment",
        options: {
          autocomplete: "off",
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
                must_auto_pay: { not: { const: true } },
              },
            },
          },
        },
      },
    ],
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------

export function canBeStored(gateway: IGateway) {
  if (!gateway) return false;

  const {
    is_stored,
    gateway_provider,
    store_on_payment,
    store_outside_payment,
  } = gateway;
  const { store_type } = gateway_provider;
  if (!is_stored) return false;
  if (store_type === GatewayStoreType.NONE) return false;
  if (store_outside_payment) return true;
  if (store_on_payment) return false;
  return true;
}
