// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";
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
  gateway_id?: String;
}

// --------------------------------------------------------
// Contexts

export interface PaymentDetailsContext {
  // ---
  basket_id?: string;
  client_id?: string;
  // TODO:
  // currency?: iCurrency;
  // address?: iAddress;
  currency?: any;
  address?: any;
  // ---
  // TODO:
  // gateways?: Array<IGateway>;
  gateways?: any[];
  payment_types?: PaymentTypes;
  // ---
  stored_payment_methods?: Array<IPaymentDetail>;
  // TODO:
  // balance?: IWalletBalance;
  // gateway?: IGateway;
  balance?: any;
  gateway?: any;
  // ---

  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IPaymentDetail;
  // ---
  mount?: HTMLElement;
  paymentDetails?: object; // This is the response from the actual payment gateway
  // --- SPAWNED ACTORS/MACHINES
  actors: {
    gateway?: ActorRef<any, any>;
  };

  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface PaymentDetailsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IPaymentDetail;
  // TODO:
  // error?: RequestError;
  error?: any;
}

export interface RefreshEvent {
  type: "REFRESH";
  // TODO:
  // data?: IBasket;
  // error?: RequestError;
  data?: any;
  error?: any;
}
