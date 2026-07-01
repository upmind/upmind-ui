/** @internal */
import { GatewayProviderCodes } from "@upmind-automation/types";
import { canBeStored } from "../payment-gateways/payment-gateways.utils";
import { isFree, isPayLater } from "./payment-details.utils";
import { useTranslateField, useTranslateName } from "../../utils";
import {
  isArray,
  map,
  pick,
  find,
  defaults,
  add,
  isEmpty,
  get
} from "lodash-es";
import type {
  PaymentDetail,
  Gateway,
  PaymentDetailsContext,
  PaymentDetailModel,
  AccountCredit,
  PaymentDetailData
} from "./payment-details.types";
import type {
  IGateway,
  IPaymentDetail,
  SelectPaymentMethodData,
  StoredCardData,
  GatewayData,
  IWalletBalance,
  ICurrency,
  IWalletCurrencyBalance
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export function mapAccountCredit(
  raw: IWalletBalance,
  currency: ICurrency["code"]
): AccountCredit {
  const balance = get(raw.total, currency) as IWalletCurrencyBalance;
  const credit = get(
    raw.negative_allowance,
    currency
  ) as IWalletCurrencyBalance;
  return {
    owned: {
      value: Math.max(balance?.amount_converted ?? 0, 0),
      amount: balance?.amount_converted_formatted || ""
    },
    credit: {
      value: Math.max(credit?.amount_converted ?? 0, 0),
      amount: credit?.amount_converted_formatted || ""
    },
    total: {
      value: Math.max(
        add(balance?.amount_converted, credit?.amount_converted) ?? 0,
        0
      ),
      amount: "" // we will set this later
    }
  };
}

export function mapPaymentDetails(
  raw: IPaymentDetail | IPaymentDetail[]
): PaymentDetail[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapPaymentDetail);
}

export function mapPaymentDetail(raw: IPaymentDetail): PaymentDetail {
  return {
    name: raw.name,
    addressId: raw.address_id,
    cardCvv: raw.card_cvv,
    cardExpireDate: raw.card_expire_date,
    cardLast4: raw.card_last4,
    cardNum: raw.card_num,
    cardToken: raw.card_token,
    cardType: raw.card_type,
    clientId: raw.client_id,
    currency: {
      id: raw.currency?.id,
      code: raw.currency?.code
    },
    gatewayId: raw.gateway_id ?? undefined,
    id: raw.id,
    title: useTranslateName(raw),
    type: raw.type,
    meta: {
      isActive: !!raw.active,
      isDefault: !!raw.default,
      canDelete: !!raw.can_delete,
      isAutoPayment: !!raw.auto_payment
    }
  };
}

export function mapGateways(raw: IGateway | IGateway[]): Gateway[] {
  const rawListings = isArray(raw) ? raw : [raw];
  return map(rawListings, mapGateway);
}

export function mapGateway(raw: IGateway): Gateway {
  return {
    id: raw.id,
    title: useTranslateName(raw),
    type: raw.type as any,
    // paymentType :
    cardTypes: raw.card_types,
    currencies: raw.currencies,
    gatewayProvider: raw.gateway_provider,
    gatewaySettings: raw.gateway_settings,
    instructions: useTranslateField(raw, "payment_instructions"),
    paymentType: raw.payment_type,
    provider: raw.provider,
    meta: {
      canStore: canBeStored(raw),
      isStored: !!raw.is_stored,
      mustStore: !!raw.store_on_payment_force,
      useFrontendImplementation: !!raw.use_frontend_implementation
    }
  };
}

// ---
function mapStoredPaymentDetailData(model: PaymentDetailModel) {
  return {
    payment_details_id: model.payment_details_id
  } as StoredCardData;
}

function mapGatewayData(data: GatewayData) {
  return pick(data, [
    "gateway_id",
    "store_on_payment",
    "store_on_payment_auto_payment",
    "payment_method_addition"
  ]);
}

export function mapPaymentData({
  clientId,
  data,
  model,
  lookups,
  requirePaymentForFreeOrders
}: {
  clientId: PaymentDetailsContext["client"]["id"];
  data?: SelectPaymentMethodData;
  lookups: PaymentDetailsContext["lookups"];
  model: PaymentDetailModel;
  requirePaymentForFreeOrders?: boolean;
}): PaymentDetailData | undefined {
  // Deferring payment — nothing to send
  if (isPayLater(model)) return undefined;

  // Free order — unless brand requires a payment method to be captured
  if (isFree(model) && !requirePaymentForFreeOrders) return undefined;

  // Create the base payment detail object that ALL payment methods will use
  const paymentDetail: Partial<PaymentDetailData> = {
    amount: model.amount,
    wallet_amount: Math.max(0, model.wallet_amount ?? 0) || undefined,
    client_id: clientId,
    return_url: model?.return_url,
    cancel_url: model?.cancel_url
  };

  //  Then check if we're using a stored payment method and return that data
  if (model.payment_details_id) {
    return defaults(
      mapStoredPaymentDetailData(model),
      paymentDetail
    ) as PaymentDetailData;
  }

  // Otherwise, check if we are using a gateway, and  map the data based on the gateway type
  if (model.gateway_id && !isEmpty(data)) {
    const brandGateway = find(lookups.gateways, [
      "gateway_id",
      model.gateway_id
    ]);

    // map our specific gateway data
    switch (brandGateway?.gateway?.gateway_provider?.code) {
      // Type 1: CARD (SDK/REDIRECT) GATEWAYS
      case GatewayProviderCodes.BRAINTREE:
      case GatewayProviderCodes.COIN_GATE:
      case GatewayProviderCodes.D_LOCAL_CARD:
      case GatewayProviderCodes.FLUTTERWAVE:
      case GatewayProviderCodes.MERCADO_PAGO_OTHER_PAYMENTS:
      case GatewayProviderCodes.MICROPAYMENT:
      case GatewayProviderCodes.OPENPAY:
      case GatewayProviderCodes.PAY_FAST:
      case GatewayProviderCodes.PAY_U:
      case GatewayProviderCodes.PAYPAL_BILLING_AGREEMENT:
      case GatewayProviderCodes.PAYPAL_EXPRESS:
      case GatewayProviderCodes.PAYPAL_PRO:
      case GatewayProviderCodes.PAYSAFECARD:
      case GatewayProviderCodes.PAYSTACK:
      case GatewayProviderCodes.PESA_PAL:
      case GatewayProviderCodes.RAZOR_PAY_CHECKOUT:
      case GatewayProviderCodes.RAZOR_PAY:
      case GatewayProviderCodes.STRIPE:
      case GatewayProviderCodes.WORLD_PAY_JSON:
        return defaults(
          mapGatewayData(data),
          paymentDetail
        ) as PaymentDetailData;

      // EXTERNAL STORE GATEWAYS

      // TYPE 10: AWAITING CLIENT GATEWAYS
      case GatewayProviderCodes.SSL_COMMERZ:
      case GatewayProviderCodes.GO_CARDLESS: // REQUIRES CUSTOM IMPLEMENTATION LIKE SDK
        return defaults(
          mapGatewayData(data),
          paymentDetail
        ) as PaymentDetailData;

      // TYPE 10: AWAITING CLIENT GATEWAYS
      case GatewayProviderCodes.BIT_PAY:
      case GatewayProviderCodes.BLOCKONOMICS:
      case GatewayProviderCodes.COIN_GATE:
      case GatewayProviderCodes.D_LOCAL:
      case GatewayProviderCodes.MERCADO_PAGO:
      case GatewayProviderCodes.OPENPAY_NON_CARD:
      case GatewayProviderCodes.PAYTM:
        return defaults(
          mapGatewayData(data),
          paymentDetail
        ) as PaymentDetailData;

      // TYPE 6 : MOBILE GATEWAYS - DEPRECATED
      case GatewayProviderCodes.MOMO_MTN_COLLECTIONS:
        return undefined;

      // TYPE 2 + TYPE 5: "MANUAL/OFFLINE" GATEWAYS THAT DONT REQUIRE A PAYMENT DETAIL
      case GatewayProviderCodes.OFFLINE:
      case GatewayProviderCodes.BANK_TRANSFER:
        return undefined;

      // UNKNOWN + UNSUPPORTED GATEWAYS
      default:
      case GatewayProviderCodes.ADYEN: // SDK
      case GatewayProviderCodes.SAGE_PAY_DIRECT:
        //  DO NOTHING, FALLBACK TO PAY LATER
        return undefined;

      // DEPRECATED GATEWAYS
      case GatewayProviderCodes.FLUTTERWAVE_CARD:
      case GatewayProviderCodes.PAYPAL_LEGACY_SUBSCRIPTION:
      case GatewayProviderCodes.PAYPAL_REST:
      case GatewayProviderCodes.PAYPAL_SUBSCRIPTION_AGREEMENT:
        //  DO NOTHING, FALLBACK TO PAY LATER
        return undefined;
    }
  }

  // Finally As a catch all we will force "manual payments" to allow the order to go through but not take payment
  return paymentDetail as PaymentDetailData;
}
