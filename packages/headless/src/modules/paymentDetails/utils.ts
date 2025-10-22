// --- external
import { AnyEventObject, spawn } from "xstate";

// --- internal
import gatewayMachine from "./gateways/gateway.machine";

// --- gateways
import braintreeConfig from "./gateways/braintree";
import openPayConfig from "./gateways/openPay";
import stripeConfig from "./gateways/stripe";

// --- utils

// --- types
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import { GatewayParams } from "./gateways/types";
import { GatewayProviderCodes } from "@upmind-automation/types";
import { StripeContext } from "./gateways/stripe/types";
import { BraintreeContext } from "./gateways/braintree/types";
import { OpenPayContext } from "./gateways/openPay/types";
import { includes } from "lodash-es";

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
  clientId
}: GatewayParams) {
  switch (gateway.gateway_provider?.code) {
    // SDK SPECIFIC gateways
    case GatewayProviderCodes.BRAINTREE:
      return spawn(
        gatewayMachine<BraintreeContext>(gateway.gateway_provider.code)
          .withContext({
            address,
            amount,
            clientId,
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

    case GatewayProviderCodes.OPENPAY:
      return spawn(
        gatewayMachine<OpenPayContext>(gateway.gateway_provider.code)
          .withContext({
            address,
            amount,
            clientId,
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
      if (!gateway?.use_frontend_implementation)
        console.warn(
          `DEPRECATION: ${gateway.name} is no longer supported via Headless`
        );

      return spawn(
        gatewayMachine<StripeContext>(gateway.gateway_provider.code)
          .withContext({
            address,
            amount,
            clientId,
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

    // SUPPORTED GENERIC OFFSITE GATEWAYS
    case GatewayProviderCodes.BANK_TRANSFER:
    case GatewayProviderCodes.FLUTTERWAVE:
    case GatewayProviderCodes.MICROPAYMENT:
    case GatewayProviderCodes.OFFLINE:
    case GatewayProviderCodes.PAYPAL_BILLING_AGREEMENT:
    case GatewayProviderCodes.PAYPAL_EXPRESS:
    case GatewayProviderCodes.PAYPAL_PRO:
    case GatewayProviderCodes.PAYSTACK:
      return spawn(
        gatewayMachine(gateway.gateway_provider.code).withContext({
          address,
          amount,
          clientId,
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

    // DEPRECATED/UNSUPPORTED OR UNKNOWN GATEWAYS
    default:
    case GatewayProviderCodes.ADYEN:
    case GatewayProviderCodes.BIT_PAY:
    case GatewayProviderCodes.BLOCKONOMICS:
    case GatewayProviderCodes.COIN_GATE:
    case GatewayProviderCodes.D_LOCAL:
    case GatewayProviderCodes.FLUTTERWAVE_CARD:
    case GatewayProviderCodes.GO_CARDLESS:
    case GatewayProviderCodes.MERCADO_PAGO:
    case GatewayProviderCodes.MERCADO_PAGO_OTHER_PAYMENTS:
    case GatewayProviderCodes.MOMO_MTN_COLLECTIONS:
    case GatewayProviderCodes.OPENPAY_NON_CARD:
    case GatewayProviderCodes.PAYPAL_LEGACY_SUBSCRIPTION:
    case GatewayProviderCodes.PAYPAL_SUBSCRIPTION_AGREEMENT:
    case GatewayProviderCodes.PAYSAFECARD:
    case GatewayProviderCodes.PAYTM:
    case GatewayProviderCodes.PAY_FAST:
    case GatewayProviderCodes.PAY_U:
    case GatewayProviderCodes.PESA_PAL:
    case GatewayProviderCodes.RAZOR_PAY:
    case GatewayProviderCodes.RAZOR_PAY_CHECKOUT:
    case GatewayProviderCodes.SAGE_PAY_DIRECT:
    case GatewayProviderCodes.WORLD_PAY_JSON:
      // --- Deprecation warnings
      if (
        includes(
          [GatewayProviderCodes.PAYPAL_REST],
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
          clientId,
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
