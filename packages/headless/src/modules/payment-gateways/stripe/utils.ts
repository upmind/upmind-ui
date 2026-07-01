import {
  ISO_4217_CURRENCY_CODE,
  type IGateway
} from "@upmind-automation/types";
import { zeroDecimalCurrencies } from "../payment-gateways.utils";
import {
  IDEAL_PC,
  PAYPAL_PC,
  SEPA_PC,
  STRIPE_PAYMENT_METHOD_TYPES
} from "./types";
import { reduce, includes, find, values } from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * Get the supported payment methods for a specific gateway and currency.
 * @param gateway The payment gateway to check.
 * @param currency The currency to check.
 * @returns An array of supported payment methods.
 */
export function getSupportedPaymentMethods(
  gateway: IGateway,
  currency: string
) {
  const currencyCode = currency?.toUpperCase() as any; // ensure it's uppercase

  if (!gateway) return [];

  return reduce(
    gateway.gateway_settings,
    (result: STRIPE_PAYMENT_METHOD_TYPES[], setting) => {
      result ??= [];

      if (
        includes(
          [
            "paymentMethodCard",
            "paymentMethodPayPal",
            "paymentMethodSepaDebit",
            "paymentMethodIdeal"
          ],
          setting.field
        ) &&
        setting.value === "1"
      ) {
        switch (setting.field) {
          case "paymentMethodCard":
            result.push(STRIPE_PAYMENT_METHOD_TYPES.CARD);
            break;

          case "paymentMethodPayPal":
            // If currency is not supported for PayPal, return nothing
            if (values(PAYPAL_PC).includes(currencyCode))
              result.push(STRIPE_PAYMENT_METHOD_TYPES.PAYPAL); // https://docs.stripe.com/payments/paypal
            break;

          case "paymentMethodSepaDebit":
            // If currency is not supported for SEPA Debit, return nothing
            if (values(SEPA_PC).includes(currencyCode))
              result.push(STRIPE_PAYMENT_METHOD_TYPES.SEPA_DEBIT); // https://docs.stripe.com/payments/sepa-debit
            break;

          case "paymentMethodIdeal":
            // If currency is not supported for iDEAL, return nothing
            if (values(IDEAL_PC).includes(currencyCode))
              result.push(STRIPE_PAYMENT_METHOD_TYPES.IDEAL); // https://docs.stripe.com/payments/ideal
            break;

          default:
            break;
        }
      }
      return result;
    },
    []
  );
}

/**
 * Convert a standard currency amount to its minor unit equivalent.
 * Takes into account zero-decimal currencies.
 *
 *  E.g. JPY 1000 becomes 1000 (no conversion as JPY is zero-decimal)
 *  E.g. UGX 1000 becomes 100000 (x100 as UGX has 2 decimal places)
 *  E.g. USD 10.00 becomes 1000 (cents)
 *
 * @param value
 * @param currency
 * @returns
 */
export function parseMinorUnitAmount(value: number, currency: string) {
  const currencyCode = currency?.toUpperCase() as any; // ensure it's uppercase

  const amount = value || 0;
  // First, handle special case for UGX (Ugandan Shilling)
  // ↳ Round to nearest integer, then convert to minor unit (x100)
  if ([ISO_4217_CURRENCY_CODE.UGX].includes(currencyCode))
    return Math.round(amount) * 100;
  // Else, if currency is zero-decimal, return amount as-is
  if (zeroDecimalCurrencies.includes(currencyCode)) return amount;
  // Otherwise, return amount x100 to convert to minor unit
  return Math.round(amount * 100);
}

/**
 * @name stripe_publicKey
 * @desc Here we get the Stripe publicKey from the gateway settings.
 */
export function getPublicKey(gateway?: IGateway) {
  const setting = find(gateway?.gateway_settings || [], ["field", "publicKey"]);
  return setting?.value;
}
