// --- external
import { spawn } from "xstate";

// --- internal
import gatewayMachine from "./gateways/gateway.machine";

// --- gateways
import braintreeConfig from "./gateways/braintree";
import openPayConfig from "./gateways/openPay";
import stripeConfig from "./gateways/stripe";
import razorpayConfig from "./gateways/razorpay";
// import mercadoPagoConfig from "./gateways/mercadoPago";

// --- utils

// --- types
import {
  BrandConfigKeys,
  GatewayContext as GatewayCtx,
  GatewayTypes,
  InvoiceStatus,
  type IBrandGateway,
  PaymentType
} from "@upmind-automation/types";
import { type GatewayParams } from "./gateways/types";
import { GatewayProviderCodes } from "@upmind-automation/types";
import { type StripeContext } from "./gateways/stripe/types";
import { type BraintreeContext } from "./gateways/braintree/types";
import { type OpenPayContext } from "./gateways/openPay/types";
import { filter, get, includes, some, sortBy, unset } from "lodash-es";
import { type RazorpayContext } from "./gateways/razorpay/types";
import { type PaymentDetail, type PaymentDetailsContext } from "./types";
// import { MercadoPagoContext } from "./gateways/mercadoPago/types";

// -----------------------------------------------------------------------------

/**
 * Spawns the appropriate gateway machine based on the gateway provided
 * This is the single source of truth to spawn any gateway machine
 * It will return undefined if the gateway is not supported by Headless
 * @param context: Partial<GatewayContext> - should contain at least orderId, gateway, amount, currency, clientId
 * @returns a spawned gateway machine or undefined if the gateway is not supported
 */
export function spawnGateway({
  orderId,
  gateway,
  amount,
  currency,
  address,
  client
}: GatewayParams) {
  switch (gateway.gateway_provider?.code) {
    // SUPPORTED SDK GATEWAYS
    case GatewayProviderCodes.BRAINTREE:
      return spawn(
        gatewayMachine<BraintreeContext>(gateway.gateway_provider.code)
          .withContext({
            address,
            amount,
            client,
            ctx: GatewayCtx.PAY,
            currency,
            gateway,
            orderId,
            supported: true
          })
          .withConfig(braintreeConfig),
        {
          name: gateway.id,
          sync: true
        }
      );
    // case GatewayProviderCodes.MERCADO_PAGO:
    //   return spawn(
    //     gatewayMachine<MercadoPagoContext>(gateway.gateway_provider.code)
    //       .withContext({
    //         address,
    //         amount,
    //         client,
    //         ctx: GatewayCtx.PAY,
    //         currency,
    //         gateway,
    //         orderId,
    //         supported: true
    //       })
    //       .withConfig(mercadoPagoConfig),
    //     {
    //       name: gateway.id,
    //       sync: true
    //     }
    //   );
    case GatewayProviderCodes.OPENPAY:
      return spawn(
        gatewayMachine<OpenPayContext>(gateway.gateway_provider.code)
          .withContext({
            address,
            amount,
            client,
            ctx: GatewayCtx.PAY,
            currency,
            gateway,
            orderId,
            supported: true
          })
          .withConfig(openPayConfig),
        { name: gateway.id, sync: true }
      );
    case GatewayProviderCodes.STRIPE:
      if (!gateway?.use_frontend_implementation) {
        console.warn(
          `DEPRECATION: ${gateway.name} is no longer supported via Headless`
        );
        // spawn a renderless unsupported gateway machine to allow orders to be placed without payment
        return spawn(
          gatewayMachine(gateway.gateway_provider.code).withContext({
            address,
            amount,
            client,
            ctx: GatewayCtx.PAY,
            currency,
            gateway,
            orderId,
            renderless: true,
            sdk: false,
            supported: false
          }),
          { name: gateway.id, sync: true }
        );
      }

      return spawn(
        gatewayMachine<StripeContext>(gateway.gateway_provider.code)
          .withContext({
            address,
            amount,
            client,
            ctx: GatewayCtx.PAY,
            currency,
            gateway,
            orderId,
            supported: !!gateway?.use_frontend_implementation
          })
          .withConfig(
            !!gateway?.use_frontend_implementation ? stripeConfig : {}
          ),
        { name: gateway.id, sync: true }
      );
    case GatewayProviderCodes.RAZOR_PAY_CHECKOUT:
      return spawn(
        gatewayMachine<RazorpayContext>(gateway.gateway_provider.code)
          .withContext({
            address,
            amount,
            client,
            ctx: GatewayCtx.PAY,
            currency,
            gateway,
            orderId,
            supported: true,
            renderless: true
          })
          .withConfig(razorpayConfig),
        { name: gateway.id, sync: true }
      );

    // SUPPORTED NON SDK "SIMPLE" GATEWAYS
    case GatewayProviderCodes.BANK_TRANSFER:
    case GatewayProviderCodes.BIT_PAY:
    case GatewayProviderCodes.BLOCKONOMICS:
    case GatewayProviderCodes.COIN_GATE:
    case GatewayProviderCodes.D_LOCAL:
    case GatewayProviderCodes.FLUTTERWAVE:
    case GatewayProviderCodes.GO_CARDLESS:
    case GatewayProviderCodes.MICROPAYMENT:
    case GatewayProviderCodes.OFFLINE:
    case GatewayProviderCodes.OPENPAY_NON_CARD:
    case GatewayProviderCodes.PAY_FAST:
    case GatewayProviderCodes.PAY_U:
    case GatewayProviderCodes.PAYPAL_BILLING_AGREEMENT:
    case GatewayProviderCodes.PAYPAL_EXPRESS:
    case GatewayProviderCodes.PAYPAL_PRO:
    case GatewayProviderCodes.PAYSAFECARD:
    case GatewayProviderCodes.PAYSTACK:
    case GatewayProviderCodes.PAYTM:
    case GatewayProviderCodes.PESA_PAL:
    case GatewayProviderCodes.RAZOR_PAY:
    case GatewayProviderCodes.RAZOR_PAY:
    case GatewayProviderCodes.SSL_COMMERZ:
    case GatewayProviderCodes.WORLD_PAY_JSON:
      return spawn(
        gatewayMachine(gateway.gateway_provider.code).withContext({
          address,
          amount,
          client,
          ctx: GatewayCtx.PAY,
          currency,
          gateway,
          orderId,
          renderless: true,
          sdk: false,
          supported: true
        }),
        { name: gateway.id, sync: true }
      );

    // UNSUPPORTED/UNKNOWN GATEWAYS
    default:
    case GatewayProviderCodes.ADYEN:
    case GatewayProviderCodes.MERCADO_PAGO_OTHER_PAYMENTS:
    case GatewayProviderCodes.MERCADO_PAGO:
    // --- DEPRECATED SDK GATEWAYS
    case GatewayProviderCodes.MOMO_MTN_COLLECTIONS:
    case GatewayProviderCodes.SAGE_PAY_DIRECT:
    case GatewayProviderCodes.FLUTTERWAVE_CARD:
    case GatewayProviderCodes.PAYPAL_LEGACY_SUBSCRIPTION:
    case GatewayProviderCodes.PAYPAL_REST:
    case GatewayProviderCodes.PAYPAL_SUBSCRIPTION_AGREEMENT:
      // --- Deprecation warnings
      if (
        includes(
          [
            GatewayProviderCodes.MOMO_MTN_COLLECTIONS,
            GatewayProviderCodes.SAGE_PAY_DIRECT,
            GatewayProviderCodes.FLUTTERWAVE_CARD,
            GatewayProviderCodes.PAYPAL_LEGACY_SUBSCRIPTION,
            GatewayProviderCodes.PAYPAL_REST,
            GatewayProviderCodes.PAYPAL_SUBSCRIPTION_AGREEMENT
          ],
          gateway.gateway_provider?.code
        )
      ) {
        console.warn(
          `DEPRECATION: ${gateway.name} is no longer supported via Headless`
        );
      }

      // spawn a renderless unsupported gateway machine to allow orders to be placed without payment
      return spawn(
        gatewayMachine(gateway.gateway_provider.code).withContext({
          address,
          amount,
          client,
          ctx: GatewayCtx.PAY,
          currency,
          gateway,
          orderId,
          renderless: true,
          sdk: false,
          supported: false
        }),
        { name: gateway.id, sync: true }
      );
  }
}

/**
 *  Filters the stored payment methods to only include those that have a corresponding supported gateway.
 * @param paymentDetails - The array of stored payment methods.
 * @param gateways - The array of available gateways.
 * @returns The filtered array of stored payment methods.
 **/
export function filterPaymentDetails(
  paymentDetails: PaymentDetail[],
  gateways: IBrandGateway[]
): PaymentDetail[] {
  return sortBy(
    filter(paymentDetails, method =>
      some(gateways, ["gateway_id", method.gatewayId])
    ),
    [method => !method.meta.isDefault, "order"]
  );
}

/**
 * Filters gateways based on the payment type and order status.
 * If we are paying with account credit OR the order is not a draft (basket),
 * we CANNOT use offline or Bank Transfer gateways
 * as these gateways dont provide a payment method we can send to the backend.
 * @param brandGateways
 * @param model
 * @param orderStatus
 * @returns
 */
export function filterGateways(
  brandGateways: IBrandGateway[],
  model: PaymentDetailsContext["model"],
  orderStatus: PaymentDetailsContext["orderStatus"]
): IBrandGateway[] {
  const values = sortBy(
    filter(brandGateways, ({ gateway }) => {
      if (model?.wallet_amount || orderStatus !== InvoiceStatus.DRAFT) {
        return !includes(
          [GatewayTypes.OFFLINE, GatewayTypes.BANK_TRANSFER],
          gateway?.gateway_provider?.type
        );
      }
      return true;
    }),
    ["order"]
  );

  return values;
}

export function filterPaymentTypes(
  config: PaymentDetailsContext["raw"]["config"],
  model?: PaymentDetailsContext["model"]
): Record<string, PaymentType> {
  const paymentTypes: Record<string, PaymentType> = {
    FULL_PAYMENT: PaymentType.PAY_IN_FULL // ALWAYS AVAILABLE
  };

  if (get(config, BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED))
    paymentTypes["PARTIAL_PAYMENT"] = PaymentType.PARTIAL_PAYMENT;

  if (get(config, BrandConfigKeys.PAY_LATER_ENABLED))
    paymentTypes["PAY_LATER"] = PaymentType.PAY_LATER; // Allowlist payment gateways if provided
  // If we are paying with account credit then we CANNOT use partial payments
  if (model?.wallet_amount) {
    unset(paymentTypes, "PAY_LATER");
  }

  return paymentTypes;
}

// -----------------------------------------------------------------------------
