import { GatewayStoreType, QUERY_PARAMS } from "@upmind-automation/types";
import {
  ZERO_DECIMAL_CURRENCIES,
  type GatewayContext
} from "./payment-gateways.types";
import { filter, keyBy, mapValues, values } from "lodash-es";
import type { IGateway, PaymentMethodType } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Build the gateway return URLs, referencing the payment via a single
 * `operation_id` (the FE-3030 operations registry) rather than legacy base64
 * params.
 *
 * @param url - The base landing URL; copied per leg, never mutated in place.
 * @param options.operationId - The minted operation reference, appended to
 *   every concrete leg (success, fail, cancel). Absent = no reference emitted.
 * @param options.type - Optional payment method type, carried as `pmt`.
 * @returns The `successUrl`, `failUrl`, `cancelUrl`, and the composite
 *   `returnUrl` wrapper.
 */
export function generateResponseUrls(
  url: URL,
  options?: {
    operationId?: string;
    type?: PaymentMethodType;
  }
) {
  const { operationId, type } = options || {};

  const successUrl = new URL(url);
  successUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "true");

  const failUrl = new URL(url);
  failUrl.searchParams.append(QUERY_PARAMS.PAYMENT_SUCCESS, "false");

  const cancelUrl = new URL(url);

  if (type) {
    cancelUrl.searchParams.append(
      QUERY_PARAMS.PAYMENT_METHOD_TYPE,
      type.toString()
    );
  }

  if (operationId) {
    successUrl.searchParams.append(QUERY_PARAMS.OPERATION_ID, operationId);
    failUrl.searchParams.append(QUERY_PARAMS.OPERATION_ID, operationId);
    cancelUrl.searchParams.append(QUERY_PARAMS.OPERATION_ID, operationId);
  }

  // The wrapper is not a landing URL — it transports operation_id inside its
  // already-encoded success/fail legs, so it is never appended to directly.
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
      // JSON.parse has no non-throwing alternative; invalid JSON returns raw.
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

// -----------------------------------------------------------------------------
// Payer contact detection — some gateways (dLocal, Nicky) must relay the payer's
// email/phone in `payment_method_addition` when the payer has none on file. A
// guest, or a logged-in client missing the value, needs it collected.

/**
 * The payer's email on file, if any.
 */
export function getPayerEmail(context: GatewayContext): string | undefined {
  return (
    context.client?.email || context.client?.default_email?.email || undefined
  );
}

/**
 * Whether the payer's email must be collected — guest checkout, or a logged-in
 * client without an email on file.
 */
export function payerNeedsEmail(context: GatewayContext): boolean {
  return !!context.client?.is_guest || !getPayerEmail(context);
}

/**
 * Whether the payer's phone must be collected — guest checkout, or a logged-in
 * client without a phone on file. NB: relies on `client.default_phone` being
 * loaded (a "requires relation" field); an unloaded relation reads as no phone.
 */
export function payerNeedsPhone(context: GatewayContext): boolean {
  return !!context.client?.is_guest || !context.client?.default_phone?.phone;
}
