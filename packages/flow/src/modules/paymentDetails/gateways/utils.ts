// --- external

// --- internal

// --- utils

// --- types
import { QUERY_PARAMS } from "./types.d";
import type { GatewayContext } from "./types.d";
import type { UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export function generateUrls(operation_id?: string) {
  const url = new URL(window.location.pathname, window.location.origin);
  // if (operation_id)
  url.searchParams.append(QUERY_PARAMS.OPERATION_ID, operation_id || "");

  const successUrl = url;
  successUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "true");

  const failUrl = url;
  successUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "false");

  return {
    cancel: url.toString(),
    cancelEncoded: encodeURIComponent(url.toString()),
    succes: successUrl.toString(),
    successsEncoded: encodeURIComponent(successUrl.toString()),
    fail: failUrl.toString(),
    failEncoded: encodeURIComponent(failUrl.toString())
  };
}

export const useSchema = ({ gateway, operation_id }: GatewayContext) => {
  const { cancel, successsEncoded, failEncoded } = generateUrls(operation_id);
  debugger;
  const schema = {
    type: "object",
    title: "Payment Gateway Options",
    required: ["gateway_id"],
    properties: {
      gateway_id: {
        type: "string",
        title: "Gateway ID",
        const: gateway.id
      },
      return_url: {
        type: "string",
        title: "Return URL",
        format: "uri-reference",
        const: `?${QUERY_PARAMS.SUCCESS}=${successsEncoded}&${QUERY_PARAMS.FAILED}=${failEncoded}`
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
