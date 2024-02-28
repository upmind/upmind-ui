// --- external

// --- internal

// --- utils

// --- types
import { QUERY_PARAMS } from "./types.d";
import type { GatewayContext } from "./types.d";
import type { UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export function generateUrls({
  gateway,
  basket_id,
  type,
  operation_id,
  model
}: GatewayContext) {
  const url = new URL(window.location.pathname, window.location.origin);
  // if (operation_id)
  url.searchParams.append(QUERY_PARAMS.OPERATION_ID, operation_id || "");

  // ---
  const successUrl = new URL(url);
  successUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "true");

  // ---
  const failUrl = new URL(url);
  failUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "false");

  // ---
  const cancelUrl = new URL(url);
  cancelUrl.searchParams.append("basketId", basket_id);
  cancelUrl.searchParams.append(QUERY_PARAMS.ORDER_ID, basket_id);
  cancelUrl.searchParams.append(
    QUERY_PARAMS.AUTO_PAY,
    encodeURIComponent(btoa(JSON.stringify(model?.auto_payment)))
  );
  cancelUrl.searchParams.append(
    QUERY_PARAMS.INIT_PAY,
    encodeURIComponent(
      btoa(
        JSON.stringify(
          gateway?.gateway_provider?.external_payment
            ? { invoiceId: order.id }
            : undefined
        )
      )
    )
  );
  cancelUrl.searchParams.append(QUERY_PARAMS.PAYMENT_METHOD_TYPE, type);

  // --------------------------------------------------------
  return {
    cancel: cancelUrl.toString(),
    success: successUrl.toString(),
    fail: failUrl.toString()
  };
}

export const useSchema = (context: GatewayContext) => {
  const { cancel, success, fail } = generateUrls(context);
  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: ["gateway_id"],
    properties: {
      gateway_id: {
        type: "string",
        title: "Gateway ID",
        const: context.gateway.id
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

  return schema;
};

// --------------------------------------------------------

export const useUischema = (_context: GatewayContext) => {
  const uischema = {
    type: "VerticalLayout",
    elements: []
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------
