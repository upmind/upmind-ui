// --- external

// --- internal

// --- utils

// --- types
import type { IGateway } from "@upmind-automation/types";
import { GatewayStoreType, QUERY_PARAMS } from "@upmind-automation/types";
import type { GatewayContext } from "./types";

// -----------------------------------------------------------------------------

export function generateResponseUrls(
  url: string,
  { gateway, orderId, type, model }: GatewayContext
) {
  // TODO: implemet operations machine
  // if (operation_id)
  //   url.searchParams.append(QUERY_PARAMS.OPERATION_ID, operation_id || "");
  // ---
  const successUrl = new URL(`order/${orderId}`, url);
  // successUrl.searchParams.append("orderId", orderId);
  successUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "true");

  // ---
  const failUrl = new URL(`order/${orderId}`, url);
  // failUrl.searchParams.append("orderId", orderId);
  failUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "false");

  // ---
  const cancelUrl = new URL(`order/${orderId}`, url);
  // cancelUrl.searchParams.append("orderId", orderId);
  // cancelUrl.searchParams.append(QUERY_PARAMS.ORDER_ID, orderId);
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
          gateway?.gateway_provider?.external_payment ? { orderId } : undefined
        )
      )
    )
  );

  if (type) {
    cancelUrl.searchParams.append(
      QUERY_PARAMS.PAYMENT_METHOD_TYPE,
      type.toString()
    );
  }

  return {
    cancel: cancelUrl.toString(),
    success: successUrl.toString(),
    fail: failUrl.toString()
  };
}

export function canBeStored(gateway?: IGateway) {
  if (!gateway) return false;

  const {
    is_stored,
    gateway_provider,
    store_on_payment,
    store_outside_payment
  } = gateway;
  const { store_type } = gateway_provider;
  if (!is_stored) return false;
  if (store_type === GatewayStoreType.NONE) return false;
  if (store_outside_payment) return true;
  if (store_on_payment) return false;
  return true;
}
