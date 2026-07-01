import { GatewayStoreType, QUERY_PARAMS } from "@upmind-automation/types";
import { ZERO_DECIMAL_CURRENCIES } from "./payment-gateways.types";
import { filter, keyBy, mapValues, values } from "lodash-es";
import type { IGateway, PaymentMethodType } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export function generateResponseUrls(
  url: URL,
  options?: {
    orderId?: string;
    autoPay?: boolean;
    externalPayment?: boolean;
    type?: PaymentMethodType;
    // operationId?: string;
  }
) {
  const { orderId, autoPay, externalPayment, type } = options || {};
  const successUrl = new URL(url);
  successUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "true");

  const failUrl = new URL(url);
  failUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "false");

  const cancelUrl = url;
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
    cancelUrl: cancelUrl.toString(),
    successUrl: successUrl.toString(),
    failUrl: failUrl.toString(),
    returnUrl: `?${QUERY_PARAMS.SUCCESS}=${encodeURIComponent(successUrl.toString())}&${QUERY_PARAMS.FAILED}=${encodeURIComponent(failUrl.toString())}`
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

// syntactic sugar for easier imports
export const zeroDecimalCurrencies = values<string>(ZERO_DECIMAL_CURRENCIES);
