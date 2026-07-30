import { spawn } from "xstate";
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
import { gatewayMachine } from "../payment-gateways";
import braintreeConfig from "../payment-gateways/braintree";
import dlocalConfig from "../payment-gateways/dlocal";
import mercadoPagoConfig from "../payment-gateways/mercadoPago";
import openPayConfig from "../payment-gateways/openPay";
import razorpayConfig from "../payment-gateways/razorpay";
import stripeConfig from "../payment-gateways/stripe";
import nickyConfig from "../payment-gateways/nicky";
import { useSessionStorage } from "../../utils";
import {
  filter,
  get,
  gt,
  includes,
  isEqual,
  some,
  sortBy,
  unset
} from "lodash-es";
import type {
  PaymentDetail,
  PaymentDetailModel,
  PaymentDetailsContext,
  PendingOperation
} from "./payment-details.types";
import type { BraintreeContext } from "../payment-gateways/braintree/types";
import type { MercadoPagoContext } from "../payment-gateways/mercadoPago/types";
import type { OpenPayContext } from "../payment-gateways/openPay/types";
import type { GatewayParams } from "../payment-gateways/payment-gateways.types";
import type { RazorpayContext } from "../payment-gateways/razorpay/types";
import type { StripeContext } from "../payment-gateways/stripe/types";
import type { NickyContext } from "../payment-gateways/nicky/types";

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
          .withConfig(gateway?.use_frontend_implementation ? stripeConfig : {}),
        { name: gateway.id, sync: true }
      );
    // NB: payment happens in Razorpay's own modal (no SDK to mount), but the
    // gateway must still render its own form to collect the payer email (when
    // they have none on file) so the modal prefills. It is deliberately NOT
    // flagged `renderless` — that would hide the form in the UI. `sdk: false`
    // keeps `hasRendered` satisfied so the machine still reaches `available`
    // without a render step; visibility is then schema-driven: guests get a
    // non-readOnly email field (form renders), clients with an email on file
    // get an all-readOnly schema (no form).
    case GatewayProviderCodes.RAZOR_PAY_CHECKOUT:
      return spawn(
        gatewayMachine<RazorpayContext>(gateway.gateway_provider.code)
          .withContext({
            ...params,
            sdk: false,
            supported: true
          })
          .withConfig(razorpayConfig),
        { name: gateway.id, sync: true }
      );
    // NB: renderless gateway with no SDK to mount, but it must still render its
    //     own form to collect the payer document. It is deliberately NOT flagged
    //     `renderless` — that would hide the form in the UI. `sdk: false` keeps
    //     `hasRendered` satisfied so the machine still reaches `available`
    //     without a render step. The schema is overridden to collect the
    //     document into payment_method_addition.
    case GatewayProviderCodes.D_LOCAL:
      return spawn(
        gatewayMachine(gateway.gateway_provider.code)
          .withContext({
            ...params,
            sdk: false,
            supported: true
          })
          .withConfig(dlocalConfig),
        { name: gateway.id, sync: true }
      );

    // SUPPORTED REDIRECT GATEWAY WITH CUSTOM SCHEMA
    // NB: `renderless` is deliberately omitted (not `false`) — contextMatches
    // treats any non-nil value as a match, so `renderless: false` would still
    // suppress the form. With it absent, `isRenderless` is schema-driven: guests
    // get a non-readOnly email field (form renders), registered clients get an
    // all-readOnly schema (no form). `sdk: false` keeps `hasRendered` true so
    // the SDK rendering state is still skipped.
    case GatewayProviderCodes.NICKY:
      return spawn(
        gatewayMachine<NickyContext>(gateway.gateway_provider.code)
          .withContext({
            ...params,
            sdk: false,
            supported: true
          })
          .withConfig(nickyConfig),
        { name: gateway.id, sync: true }
      );

    // SUPPORTED NON SDK "SIMPLE" GATEWAYS
    case GatewayProviderCodes.BANK_TRANSFER:
    case GatewayProviderCodes.BIT_PAY:
    case GatewayProviderCodes.BLOCKONOMICS:
    case GatewayProviderCodes.COIN_GATE:
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
 * Filters gateways based on the payment type and order context.
 * Offline / Bank Transfer gateways give no payment method we can capture, so we
 * hide them when paying with account credit, or when there's no order/basket
 * context (the ADD payment-method flow) — they stay available on a basket
 * (draft) and on an existing order, rendering their instructions only.
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

      if (model?.wallet_amount || !orderStatus) {
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

  return hasPayableAmount || (!!requirePaymentForFreeOrders && !model?.amount);
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
 * TRUE when the status is an actual order — a non-draft invoice. A basket is
 * itself a draft invoice, and the ADD flow has no invoice at all.
 */
export function isOrder(
  orderStatus?: PaymentDetailsContext["orderStatus"]
): boolean {
  return !!orderStatus && orderStatus !== InvoiceStatus.DRAFT;
}

/**
 * Returns all payment state flags derived from model + context data.
 * Single entry point — composables destructure the result.
 *
 * These flags answer: "what does the payment DATA say?" — independent
 * of the machine's processing state (loading, checking, etc.).
 *
 * ## Key scenarios
 *
 * | Scenario                       | isFree | needsPayment | hasAccountCredit |
 * |--------------------------------|--------|--------------|------------------|
 * | Normal order (amount > 0)      | false  | true         | if credit > 0    |
 * | Free order, no capture needed  | true   | false        | false            |
 * | Free order, capture needed     | true*  | true         | false            |
 * | ADD context (save card)        | false  | true         | false            |
 * | Wallet fully covers amount     | false  | false        | if credit > 0    |
 *
 * *isFree returns true for model-level, but needsPayment overrides via
 *  requirePaymentForFreeOrders — user must still select a payment method.
 *
 * ## Backfill note
 * During transient states (currency refresh, initial load) the model
 * may be cleared while context-level amounts persist. Callers should
 * backfill `amount` and `wallet_amount` via `defaultsDeep` before
 * passing the model here.
 */
export function usePaymentState(
  model?: Partial<PaymentDetailModel>,
  ctx?: GatewayCtx,
  requirePaymentForFreeOrders?: boolean,
  isRefreshing?: boolean,
  creditAmount?: number
) {
  const free = isFree(model, ctx);

  return {
    /** TRUE when user has spendable account credit AND order is not free. */
    hasAccountCredit: ctx === GatewayCtx.PAY && gt(creditAmount, 0) && !free,

    /** TRUE when the model has a non-zero amount (and ctx ≠ ADD). */
    hasAmount: hasAmount(model, ctx),

    /** TRUE when a stored payment method is already selected on the model. */
    hasSelectedPaymentMethod:
      ctx !== GatewayCtx.ADD && !!model?.payment_details_id,

    /** TRUE when order amount is zero (and ctx ≠ ADD). */
    isFree: free,

    /** TRUE when wallet allocation equals the full order amount. */
    isFullyCoveredByWallet: isFullyCoveredByWallet(model),

    /** TRUE when payment type is PAY_IN_FULL or PARTIAL, or free+capture. */
    isPayable: isPayable(model, requirePaymentForFreeOrders, ctx),

    /** TRUE when payment type is PAY_LATER (deferred). Always false in ADD. */
    isPayLater: isPayLater(model, ctx),

    /**
     * TRUE when the user must select a payment method / gateway.
     * Accounts for:
     * - payable amount not fully covered by wallet
     * - free order with requirePaymentForFreeOrders (card capture)
     * - refreshing state with non-free amount (keep UI stable)
     * - ADD context (always needs payment method selection)
     */
    needsPayment:
      needsPayment(model, requirePaymentForFreeOrders) ||
      (!!isRefreshing && !free) ||
      (!free && !hasAmount(model, ctx)) ||
      ctx === GatewayCtx.ADD
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
