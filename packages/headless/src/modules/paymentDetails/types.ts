// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";
import type { IBasket } from "@upmind-automation/types";
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
  amount: number;
  type?: PaymentTypes;
  gateway_id?: string;
}

// --------------------------------------------------------
// Contexts

export interface PaymentDetailsContext {
  // ---
  basketId?: string;
  clientId?: string;
  currency?: any; // ICurrency
  address?: any;

  // ---
  gateways?: any[]; // IGateway[];
  payment_types?: PaymentTypes;
  // ---
  stored_payment_methods?: Array<IPaymentDetail>;
  balance?: any; //IWalletBalance
  gateway?: any; //IGateway
  // ---
  fields?: any;
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
  autoupdate?: boolean;
  dirty?: boolean;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface PaymentDetailsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IPaymentDetail;
  error?: any;
}

export interface RefreshEvent {
  type: "REFRESH";
  data?: IBasket;
  error?: any;
}
