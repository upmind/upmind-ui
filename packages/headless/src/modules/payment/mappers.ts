// --- external

// --- internal

// --- utils

// --- types
import {
  GatewayCardData,
  GatewayData,
  GatewayExternalCardData,
  GatewayMobileData,
  IClient,
  ManualPaymentData,
  PaymentMethodType,
  SelectedPaymentMethod,
  StoredCardData
} from "@upmind-automation/types";
import type { PaymentContext } from "./types";
import { isNil, omitBy, pick } from "lodash-es";

// -----------------------------------------------------------------------------

export const mapApproval = (payment: PaymentContext["payment"]) => {
  // Now we have to parse the approval_url object that is part of the payment
  // into a "form" friendly format:- so we map any query params into fields
  // that will in turn be converted to hidden inputs in the form
  // Remember we may have  been given fields already, so we need to append them
  if (!payment?.approval_url) return undefined;

  const approval_url = payment.approval_url;
  const fields = approval_url?.fields || {};
  const url = new URL(approval_url.url);
  url.searchParams.forEach((value, key) => (fields[key] = value));

  return {
    url: [url.origin, url.pathname].join(""), // only the url without query params
    method: approval_url.method,
    fields
  };
};

export function mapIPaymentModel(paymentDetails: SelectedPaymentMethod) {
  //
}

function mapStoreCardData(paymentDetails: SelectedPaymentMethod) {
  const data = paymentDetails?.data as StoredCardData;
  return { payment_details_id: data.payment_details_id };
}

function mapExternalCardGatewayData(paymentDetails: SelectedPaymentMethod) {
  const data = paymentDetails?.data as GatewayExternalCardData;
  return pick(data, [
    "gateway_id",
    "store_on_payment",
    "store_on_payment_auto_payment"
  ]);
}

function mapCardGatewayData(paymentDetails: SelectedPaymentMethod) {
  return pick(paymentDetails?.data, [
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

function mapGatewayData(paymentDetails: SelectedPaymentMethod) {
  const data = paymentDetails?.data as GatewayData;
  return pick(data, [
    "gateway_id",
    "store_on_payment",
    "store_on_payment_auto_payment"
  ]);
}

function mapGatewayMobileData(paymentDetails: SelectedPaymentMethod) {
  const data = paymentDetails?.data as GatewayMobileData;
  return pick(data, [
    "gateway_id",
    "payer",
    "store_on_payment",
    "store_on_payment_auto_payment"
  ]);
}

function mapManualPaymentData(paymentDetails: SelectedPaymentMethod) {
  return omitBy(
    pick(paymentDetails?.data, ["gateway_id", "transaction_id", "amount"]),
    isNil
  );
}

export function mapPaymentData(
  paymentDetails: SelectedPaymentMethod
): object | undefined {
  switch (paymentDetails?.type) {
    case PaymentMethodType.STORED_CARD:
      return mapStoreCardData(paymentDetails);
    case PaymentMethodType.EXTERNAL_STORE:
      return mapExternalCardGatewayData(paymentDetails);
    case PaymentMethodType.GATEWAY_CARD:
      return mapCardGatewayData(paymentDetails);
    case PaymentMethodType.GATEWAY_SEPA:
    case PaymentMethodType.GATEWAY_OFFLINE:
    case PaymentMethodType.GATEWAY_DIRECT_DEBIT:
    case PaymentMethodType.GATEWAY_BANK_TRANSFER:
    case PaymentMethodType.GATEWAY_AWAITING_CLIENT:
      return mapGatewayData(paymentDetails);
    case PaymentMethodType.GATEWAY_MOBILE:
      return mapGatewayMobileData(paymentDetails);
    case PaymentMethodType.MANUAL_PAYMENT:
      return mapManualPaymentData(paymentDetails);
  }
}
