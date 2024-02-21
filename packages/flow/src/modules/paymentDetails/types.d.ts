// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { PaymentTypes } from "./services";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IWalletBalance {
  offline: { [key: string]: IWalletCurrencyBalance };
  online: { [key: string]: IWalletCurrencyBalance };
  total: { [key: string]: IWalletCurrencyBalance };
}

export interface IWalletCurrencyBalance {
  amount: number;
  amount_formatted: string;
  amount_converted: number;
  amount_converted_formatted: string;
}

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
