// --- utils
import { isArray, map } from "lodash-es";

// --- types
import type { PaymentDetail, Gateway } from "./types";
import type { IGateway, IPaymentDetail } from "@upmind-automation/types";
import { canBeStored } from "./gateways/utils";
import { useTranslateField, useTranslateName } from "../../utils";

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
