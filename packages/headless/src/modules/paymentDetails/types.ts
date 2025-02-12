// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";
import type {
  IAddress,
  IBasket,
  PaymentType,
  PaymentMethodType,
  ICurrency,
  IGateway,
  IWalletBalance,
  IBrandGateway,
} from "@upmind-automation/types";
// --------------------------------------------------------

// --------------------------------------------------------
// private

export interface IPaymentDetail {
  amount: number;
  type?: PaymentType;
  gateway_id?: string;
}

// --------------------------------------------------------
// Contexts

export interface PaymentDetailsContext {
  // ---
  basketId?: string;
  clientId?: string;
  currency?: ICurrency;
  address?: IAddress;
  amount?: number;
  // ---
  gateways?: IBrandGateway[];
  payment_types?: PaymentType;
  // ---
  stored_payment_methods?: Array<IPaymentDetail>;
  balance?: IWalletBalance;
  gateway?: IGateway;
  // ---
  fields?: any;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IPaymentDetail;
  // ---
  mount?: HTMLElement;
  paymentDetails?: any; // This is the response from the actual payment gateway
  // --- SPAWNED ACTORS/MACHINES
  actors: {
    gateway?: ActorRef<any, any>;
  };

  // ---
  autoupdate?: boolean;
  dirty?: boolean;
  error?: any;
}
