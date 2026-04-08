// --- external
import { spawn } from "xstate";

// --- internal
import gatewayMachine from "./gateways/gateway.machine";

// --- gateways
import braintreeConfig from "./gateways/braintree";
import dlocalConfig from "./gateways/dlocal";
import openPayConfig from "./gateways/openPay";
import stripeConfig from "./gateways/stripe";
import razorpayConfig from "./gateways/razorpay";
import mercadoPagoConfig from "./gateways/mercadoPago";

// --- utils
import { filter, get, includes, isEqual, some, sortBy, unset } from "lodash-es";
import { useSessionStorage } from "../../utils";

// --- types
import {
  BrandConfigKeys,
  GatewayContext as GatewayCtx,
  GatewayTypes,
  InvoiceStatus,
  type IBrandGateway,
  PaymentType,
  QUERY_PARAMS
} from "@upmind-automation/types";
import { GatewayProviderCodes } from "@upmind-automation/types";
import type { GatewayParams } from "./gateways/types";
import type { StripeContext } from "./gateways/stripe/types";
import type { BraintreeContext } from "./gateways/braintree/types";
import type { OpenPayContext } from "./gateways/openPay/types";
import type { RazorpayContext } from "./gateways/razorpay/types";
import type { MercadoPagoContext } from "./gateways/mercadoPago/types";
import type { DLocalContext } from "./gateways/dlocal/types";
import type {
  PaymentDetail,
  PaymentDetailModel,
  PaymentDetailsContext,
  PendingOperation
} from "./types";

// -----------------------------------------------------------------------------

/**
 * Spawns the appropriate gateway machine based on the gateway provided
 * This is the single source of truth to spawn any gateway machine
 * It will return undefined if the gateway is not supported by Headless
 * @param context: Partial<GatewayContext> - should contain at least orderId, gateway, amount, currency, clientId
 * @returns a spawned gateway machine or undefined if the gateway is not supported
 */
export function spawnGateway(params: GatewayParams) {
  const { gateway } = params;
  switch (gateway.gateway_provider?.code) {
    // SUPPORTED SDK GATEWAYS
    case GatewayProviderCodes.BRAINTREE:
      return spawn(
        gatewayMachine<BraintreeContext>(gateway.gateway_provider.code)
          .withContext({
            ...params,
            supported: true
          })
          .withConfig(braintreeConfig),
        {
          name: gateway.id,
          sync: true
        }
      );
    case GatewayProviderCodes.MERCADO_PAGO:
      return spawn(
        gatewayMachine<MercadoPagoContext>(gateway.gateway_provider.code)
          .withContext({
            ...params,
            supported: true
          })
          .withConfig(mercadoPagoConfig),
        {
          name: gateway.id,
          sync: true
        }
      );
    case GatewayProviderCodes.OPENPAY:
      return spawn(
        gatewayMachine<OpenPayContext>(gateway.gateway_provider.code)
          .withContext({
            ...params,
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
            ...params,
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
            ...params,
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
            ...params,
            supported: true,
            renderless: true
          })
          .withConfig(razorpayConfig),
        { name: gateway.id, sync: true }
      );
    case GatewayProviderCodes.D_LOCAL_CARD:
      return spawn(
        gatewayMachine<DLocalContext>(gateway.gateway_provider.code)
          .withContext({
            ...params,
            supported: true
          })
          .withConfig(dlocalConfig),
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
    case GatewayProviderCodes.MERCADO_PAGO_OTHER_PAYMENTS:
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
    case GatewayProviderCodes.SSL_COMMERZ:
    case GatewayProviderCodes.WORLD_PAY_JSON:
      return spawn(
        gatewayMachine(gateway.gateway_provider.code).withContext({
          ...params,
          renderless: true,
          sdk: false,
          supported: true
        }),
        { name: gateway.id, sync: true }
      );

    // UNSUPPORTED/UNKNOWN GATEWAYS
    default:
    case GatewayProviderCodes.ADYEN:
    // --- DEPRECATED SDK GATEWAYS
    /** @deprecated No longer supported via Headless — will be removed in a future release. */
    case GatewayProviderCodes.MOMO_MTN_COLLECTIONS:
    /** @deprecated No longer supported via Headless — will be removed in a future release. */
    case GatewayProviderCodes.SAGE_PAY_DIRECT:
    /** @deprecated No longer supported via Headless — will be removed in a future release. */
    case GatewayProviderCodes.FLUTTERWAVE_CARD:
    /** @deprecated No longer supported via Headless — will be removed in a future release. */
    case GatewayProviderCodes.PAYPAL_LEGACY_SUBSCRIPTION:
    /** @deprecated No longer supported via Headless — will be removed in a future release. */
    case GatewayProviderCodes.PAYPAL_REST:
    /** @deprecated No longer supported via Headless — will be removed in a future release. */
    case GatewayProviderCodes.PAYPAL_SUBSCRIPTION_AGREEMENT:
      // spawn a renderless unsupported gateway machine to allow orders to be placed without payment
      return spawn(
        gatewayMachine(gateway.gateway_provider.code).withContext({
          ...params,
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
  orderStatus: PaymentDetailsContext["orderStatus"],
  options?: { storeOnly?: boolean }
): IBrandGateway[] {
  const values = sortBy(
    filter(brandGateways, ({ gateway }) => {
      // NB in ADD context, only show gateways that support storing payment methods
      if (options?.storeOnly && !gateway?.store_outside_payment) return false;

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
// --- payment state helpers
// Single source of truth for determining payment state.
// Used by both services.ts (model parse) and usePaymentDetail.ts (composable meta).

/**
 * TRUE if the order has no amount to pay.
 * Always FALSE in ADD context (storing a card, not paying).
 */
export function isFree(
  model?: Partial<PaymentDetailModel>,
  ctx?: GatewayCtx
): boolean {
  if (ctx === GatewayCtx.ADD) return false;
  return !model?.amount;
}

/**
 * TRUE if the model has a payable amount.
 * Always FALSE in ADD context.
 */
export function hasAmount(
  model?: Partial<PaymentDetailModel>,
  ctx?: GatewayCtx
): boolean {
  if (ctx === GatewayCtx.ADD) return false;
  return !!model?.amount;
}

/**
 * TRUE if the current flow is effectively an ADD (tokenize/store payment method).
 * Either the ctx is explicitly ADD, or it's a free order where the brand
 * requires a payment method to be captured.
 */
export function isAddFlow({
  ctx,
  amount,
  requirePaymentForFreeOrders
}: {
  ctx?: GatewayCtx;
  amount?: number;
  requirePaymentForFreeOrders?: boolean;
}): boolean {
  return ctx === GatewayCtx.ADD || (!amount && !!requirePaymentForFreeOrders);
}

/**
 * TRUE if a payment method selection is required.
 * Either there is an amount to pay (not fully covered by wallet)
 * OR the brand requires a payment method even for free orders.
 */
export function needsPayment(
  model?: Partial<PaymentDetailModel>,
  requirePaymentForFreeOrders?: boolean
): boolean {
  const hasPayableAmount =
    !!model?.amount &&
    !isEqual(model.amount, model.wallet_amount) &&
    includes(
      [PaymentType.PARTIAL_PAYMENT, PaymentType.PAY_IN_FULL],
      model.type
    );

  return hasPayableAmount || !!requirePaymentForFreeOrders;
}

/**
 * TRUE if the model payment type allows taking payment (not deferred)
 * OR order is free but brand requires a payment method to be captured.
 * Always FALSE in ADD context.
 */
export function isPayable(
  model?: Partial<PaymentDetailModel>,
  requirePaymentForFreeOrders?: boolean,
  ctx?: GatewayCtx
): boolean {
  if (ctx === GatewayCtx.ADD) return false;
  return (
    includes(
      [PaymentType.PARTIAL_PAYMENT, PaymentType.PAY_IN_FULL],
      model?.type
    ) ||
    (isFree(model) && !!requirePaymentForFreeOrders)
  );
}

/**
 * TRUE if the model payment type is deferred / pay later.
 * Always FALSE in ADD context.
 */
export function isPayLater(
  model?: Partial<PaymentDetailModel>,
  ctx?: GatewayCtx
): boolean {
  if (ctx === GatewayCtx.ADD) return false;
  return model?.type === PaymentType.PAY_LATER;
}

/**
 * TRUE if the payment amount is fully covered by wallet/account credit.
 */
export function isFullyCoveredByWallet(
  model?: Partial<PaymentDetailModel>
): boolean {
  return isEqual(model?.amount ?? 0, model?.wallet_amount ?? 0);
}

/**
 * Returns all payment state flags for a given model and context.
 * Single entry point — composables destructure the result.
 */
export function usePaymentState(
  model?: Partial<PaymentDetailModel>,
  ctx?: GatewayCtx,
  requirePaymentForFreeOrders?: boolean,
  isRefreshing?: boolean
) {
  const _isFree = isFree(model, ctx);
  const _hasAmount = hasAmount(model, ctx);
  const _needsPayment =
    needsPayment(model, requirePaymentForFreeOrders) ||
    (!!isRefreshing && !_isFree) ||
    (!_isFree && !_hasAmount) ||
    ctx === GatewayCtx.ADD;

  return {
    hasAmount: _hasAmount,
    hasSelectedPaymentMethod:
      ctx !== GatewayCtx.ADD && !!model?.payment_details_id,
    isFree: _isFree,
    isFullyCoveredByWallet: isFullyCoveredByWallet(model),
    isPayable: isPayable(model, requirePaymentForFreeOrders, ctx),
    isPayLater: isPayLater(model, ctx),
    needsPayment: _needsPayment
  };
}

// -----------------------------------------------------------------------------
// --- operation registry
// Formalised session-based persistence for off-site redirect recovery.
// Individual gateway services use these instead of touching sessionStorage directly.

/**
 * Persist an ADD operation to sessionStorage so it survives an off-site
 * redirect (e.g. 3DS / SCA). Must be called BEFORE the redirect happens.
 */
export function registerOperation(operation: PendingOperation): void {
  useSessionStorage().set("operation", operation);
}

/**
 * Remove a previously stored operation from sessionStorage.
 * Call after successful inline completion (no redirect occurred).
 */
export function clearOperation(): void {
  useSessionStorage().remove("operation");
}

/**
 * Build a return URL that carries the OPERATION_ID query param
 * so the paymentDetail machine can detect the redirect and restore.
 */
export function getOperationReturnUrl(): string {
  const returnUrl = new URL(window.location.href);
  returnUrl.searchParams.set(QUERY_PARAMS.OPERATION_ID, "1");
  return returnUrl.toString();
}
