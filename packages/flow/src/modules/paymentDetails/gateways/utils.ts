// --- external

// --- internal

// --- utils

// --- types
import { QUERY_PARAMS } from "./types.d";
import { GatewayStoreType } from "./types.d";
import type { GatewayContext, IGateway } from "./types.d";
import type { UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------

export function generateUrls({
  gateway,
  basket_id,
  type,
  operation_id,
  model,
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
    fail: failUrl.toString(),
  };
}

// --------------------------------------------------------

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
        const: context.gateway.id,
      },
      store_on_payment: {
        type: "boolean",
        title: "Save payment details",
      },
      store_on_payment_auto_payment: {
        type: "boolean",
        title: "Allow auto payment",
        description:
          "Allow this payment method to be used for making automated offline payments – such as paying a renewal invoice.",
      },
      return_url: {
        type: "string",
        title: "Return URL",
        format: "uri-reference",
        const: `?${QUERY_PARAMS.SUCCESS}=${encodeURIComponent(success)}&${QUERY_PARAMS.FAILED}=${encodeURIComponent(fail)}`,
      },
      cancel_url: {
        type: "string",
        title: "Cancel URL",
        format: "uri",
        const: cancel,
      },
    },
  };

  // enforce brand settings via setting the const value. This will ensure the value is not editable
  if (!context.can_store) {
    schema.properties.store_on_payment.const = false;
    schema.properties.store_on_payment_auto_payment.const = false;
  } else {
    if (context.must_store) schema.properties.store_on_payment.const = true;
    if (context.must_auto_pay)
      schema.properties.store_on_payment_auto_payment.const = true;
  }
  return schema;
};

// --------------------------------------------------------

export const useUischema = ({ can_store }: GatewayContext) => {
  // if (!can_store) return { type: "VerticalLayout", elements: [] };

  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/store_on_payment",
        options: {
          autocomplete: "off",
        },
      },
      {
        type: "Control",
        scope: "#/properties/store_on_payment_auto_payment",
        options: {
          autocomplete: "off",
        },
        // only show this field if we have the store_on_payment flag
        rule: {
          effect: "SHOW",
          condition: {
            scope: "#/properties/store_on_payment",
            schema: { const: true },
          },
        },
      },
    ],
  };

  return uischema as UISchemaElement;
};

// --------------------------------------------------------

export function canBeStored(gateway: IGateway) {
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
