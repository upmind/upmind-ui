// --- utils
import { isArray, map, isNil, omitBy, pick, find, defaults } from "lodash-es";

// --- types
import type {
  PaymentDetail,
  Gateway,
  PaymentDetailsContext,
  PaymentDetailModel
} from "./types";
import { GatewayProviderCodes, PaymentType } from "@upmind-automation/types";
import type {
  IGateway,
  IPaymentDetail,
  SelectPaymentMethodData,
  StoredCardData,
  GatewayCardData,
  GatewayData,
  GatewayExternalCardData,
  GatewayMobileData
} from "@upmind-automation/types";

import { canBeStored } from "./gateways/utils";
import { useTranslateField, useTranslateName } from "../../utils";

// -----------------------------------------------------------------------------

export function mapPaymentDetailDetails(
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
    gatewayID: raw.gateway_id ?? undefined,
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

function mapExternalCardGatewayData(data: GatewayExternalCardData) {
  return pick(data, [
    "gateway_id",
    "store_on_payment",
    "store_on_payment_auto_payment"
  ]);
}

function mapCardGatewayData(data: GatewayCardData) {
  return pick(data, [
    "card_type",
    "card_num",
    "card_expire_date",
    "card_cvv",
    "name",
    "address_id",
    "gateway_id",
    "cardholder_name",
    "store_on_payment",
    "store_on_payment_auto_payment"
  ]);
}

function mapGatewayData(data: GatewayData) {
  return pick(data, [
    "gateway_id",
    "store_on_payment",
    "store_on_payment_auto_payment",
    "payment_method_addition"
  ]);
}

function mapGatewayMobileData(data: GatewayMobileData) {
  return pick(data, [
    "gateway_id",
    "payer",
    "store_on_payment",
    "store_on_payment_auto_payment"
  ]);
}

export function mapPaymentData({
  amount,
  clientId,
  data,
  gateways,
  model
}: {
  amount: PaymentDetailsContext["amount"];
  clientId: PaymentDetailsContext["clientId"];
  data: SelectPaymentMethodData;
  gateways: PaymentDetailsContext["gateways"];
  model: PaymentDetailModel;
}) {
  // Create the base payment detail object that ALL payment methods will use
  const paymentDetail = {
    amount,
    client_id: clientId,
    // walletAmount: undefined,
    return_url: model?.return_url,
    cancel_url: model?.cancel_url
  };

  // Then conditionally add the payment data based on the payment method type and gateway

  // First check if we are deferring payment
  if (model.type === PaymentType.PAY_LATER) {
    return defaults({ type: PaymentType.PAY_LATER }, paymentDetail);
    // do nothing, pay later does not need any additional data
  }

  //  check if we're using a stored payment method
  if (model.payment_details_id) {
    return defaults(mapStoredPaymentDetailData(model), paymentDetail);
  }

  // Then if are using a gateway, we need to map the data based on the gateway type
  if (model.gateway_id) {
    const brandGateway = find(gateways, ["gateway_id", model.gateway_id]);

    // map our specific gateway data
    switch (brandGateway?.gateway?.gateway_provider?.code) {
      // SIMPLE SDK OR REDIRECT GATEWAYS
      case GatewayProviderCodes.BRAINTREE:
      case GatewayProviderCodes.MICROPAYMENT:
      case GatewayProviderCodes.OPENPAY:
      case GatewayProviderCodes.PAYPAL_BILLING_AGREEMENT:
      case GatewayProviderCodes.PAYPAL_EXPRESS:
      case GatewayProviderCodes.PAYPAL_LEGACY_SUBSCRIPTION:
      case GatewayProviderCodes.PAYPAL_PRO:
      case GatewayProviderCodes.PAYPAL_REST:
      case GatewayProviderCodes.PAYPAL_SUBSCRIPTION_AGREEMENT:
      case GatewayProviderCodes.STRIPE:
        return defaults(mapGatewayData(data), paymentDetail);

      // CARD GATEWAYS

      // EXTERNAL STORE GATEWAYS

      // AWAITING CLIENT GATEWAYS

      // MOBILE GATEWAYS

      // UNSUPPORTED OR UNKNOWN GATEWAYS
      default:
      case GatewayProviderCodes.ADYEN:
      case GatewayProviderCodes.BANK_TRANSFER:
      case GatewayProviderCodes.BIT_PAY:
      case GatewayProviderCodes.BLOCKONOMICS:
      case GatewayProviderCodes.COIN_GATE:
      case GatewayProviderCodes.D_LOCAL:
      case GatewayProviderCodes.FLUTTERWAVE:
      case GatewayProviderCodes.FLUTTERWAVE_CARD:
      case GatewayProviderCodes.GO_CARDLESS:
      case GatewayProviderCodes.MERCADO_PAGO:
      case GatewayProviderCodes.MERCADO_PAGO_OTHER_PAYMENTS:
      case GatewayProviderCodes.MOMO_MTN_COLLECTIONS:
      case GatewayProviderCodes.OFFLINE:
      case GatewayProviderCodes.OPENPAY_NON_CARD:
      case GatewayProviderCodes.PAYSAFECARD:
      case GatewayProviderCodes.PAYSTACK:
      case GatewayProviderCodes.PAYTM:
      case GatewayProviderCodes.PAY_FAST:
      case GatewayProviderCodes.PAY_U:
      case GatewayProviderCodes.PESA_PAL:
      case GatewayProviderCodes.RAZOR_PAY:
      case GatewayProviderCodes.RAZOR_PAY_CHECKOUT:
      case GatewayProviderCodes.SAGE_PAY_DIRECT:
      case GatewayProviderCodes.WORLD_PAY_JSON:
        //  DO NOTHING, UNSUPPORTED GATEWAYS
        return defaults({ type: PaymentType.PAY_LATER }, paymentDetail);
    }
  }

  // As a catch all we will force "manual payments" to allow the order to go through but not take payment
  return defaults({ type: PaymentType.PAY_LATER }, paymentDetail);
}
