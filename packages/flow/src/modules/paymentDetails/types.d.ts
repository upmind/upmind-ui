// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
// --------------------------------------------------------
// ENUMS

export enum PaymentTypes {
  PAY_IN_FULL = "stored-card",
  PARTIAL_PAYMENT = "partial-payment",
  PAY_LATER = "pay-later"
  // MANUAL_PAYMENT = "manual-payment" // only admi s can do this and we dont support it...YET
}

export enum GatewayTypes {
  CARD = 1,
  BANK_TRANSFER = 2,
  DIRECT_DEBIT = 3,
  SEPA = 4,
  OFFLINE = 5,
  MOBILE = 6,
  WALLET = 7
}

export enum GatewayAuthType {
  NONE = "none",
  SETTINGS = "settings",
  OAUTH2 = "oauth2"
}

export enum GatewayStoreType {
  /**
   * none (gateway does NOT support stored payment details)
   */
  NONE = "none",
  /**
   * either (gateway supports one-off payments + stored payment details)
   */
  EITHER = "either",
  /**
   * always (gateway does NOT support one-off payments; stored payment details only) - this is the case for GoCardless where an agreement (mandate) must be set up first
   */
  ALWAYS = "always"
}

export enum GatewayContext {
  PAY = "pay", // PAY = Gateways are shown in the context of making a payment (invoice, topup etc)
  ADD = "add" // ADD = Gateways are shown in the context of adding a stored payment detail
}

export enum GatewayProviderCodes {
  STRIPE = "Stripe_PaymentIntents"
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
  gateway?: IGateway;

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
