// --- external

// --- internal

// --- utils

// --- types
import type { IGateway } from "@upmind-automation/types";
import { GatewayStoreType, QUERY_PARAMS } from "@upmind-automation/types";
import type { GatewayContext } from "./types";
import { filter, keyBy, mapValues } from "lodash-es";

// -----------------------------------------------------------------------------

export function generateResponseUrls(
  url: string,
  {
    externalPayment,
    orderId,
    type,
    autoPay
    // operationId
  }: {
    orderId: string;
    autoPay?: boolean;
    externalPayment?: boolean;
    type?: number | string;
    // operationId?: string;
  }
) {
  // TODO: implemet operations machine
  // if (operationId)
  // url.searchParams.append(QUERY_PARAMS.OPERATION_ID, operationId || "");
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
    encodeURIComponent(btoa(JSON.stringify(autoPay)))
  );

  cancelUrl.searchParams.append(
    QUERY_PARAMS.INIT_PAY,
    encodeURIComponent(
      btoa(JSON.stringify(externalPayment ? { orderId } : undefined))
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

export function canBeStored(raw?: IGateway) {
  if (!raw) return false;
  if (!raw.is_stored) return false;
  if (raw.gateway_provider?.store_type === GatewayStoreType.NONE) return false;
  if (raw.store_outside_payment) return true;
  if (raw.store_on_payment) return false;
  return true;
}

export function parseSettings(gateway: IGateway) {
  return mapValues(
    keyBy(filter(gateway?.gateway_settings || [], ["private", false]), "field"),
    ({ value }) => {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  );
}
