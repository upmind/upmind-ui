// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// --------------------------------------------------------
// ENUMS

export enum PaymentTypes {
  PAY_IN_FULL = "stored-card",
  PARTIAL_PAYMENT = "partial-payment",
  PAY_LATER = "pay-later",
  // MANUAL_PAYMENT = "manual-payment" // only admi s can do this and we dont support it...YET
}

export enum PaymentMethodTypes {
  STORED_CARD = "stored-card",
  GATEWAY_CARD = "gateway-card",
  GATEWAY_BANK_TRANSFER = "gateway-bank-transfer",
  GATEWAY_DIRECT_DEBIT = "gateway-direct-debit",
  GATEWAY_SEPA = "gateway-sepa",
  GATEWAY_MOBILE = "gateway-mobile",
  GATEWAY_OFFLINE = "gateway-offline",
  PAY_LATER = "pay-later",
  MANUAL_PAYMENT = "manual-payment",
  EXTERNAL_STORE = "external-store",
}

// --------------------------------------------------------
// private

export interface IPaymentDetail {
  amount: Number;
  type?: PaymentTypes;
  gateway_id: String;
}

// --------------------------------------------------------
// Contexts

export interface PaymentDetailsContext {
  // ---
  basket_id?: string;
  currency?: iCurrency;
  // ---
  gateways?: Array<IGateway>;
  payment_types?: PaymentTypes;
  payment_details?: Array<IPaymentDetail>;
  balance?: IWalletBalance;

  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IPaymentDetail;
  // ---
  mount?: HTMLElement;
  paymentDetails?: Object; // This is the response from the actual payment gateway
  // --- SPAWNED ACTORS/MACHINES
  actors: {
    gateway?: Object;
  };

  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface PaymentDetailsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IPaymentDetail;
  error?: RequestError;
}

export interface RefreshEvent {
  type: "REFRESH";
  data?: IBasket;
  error?: RequestError;
}
