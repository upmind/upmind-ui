// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";
import type {
  IAddress,
  IBasket,
  IBrandGateway,
  IClient,
  IInvoice,
  ICurrency,
  IGateway,
  IWalletBalance,
  PaymentType,
} from "@upmind-automation/types";
// --------------------------------------------------------

// --------------------------------------------------------
// private

export interface IPaymentDetail {
  amount: number;
  type?: PaymentType;
  gateway_id?: IGateway["id"];
}

// --------------------------------------------------------
// Contexts

export interface PaymentDetailsContext {
  // ---
  id?: IBasket["id"] | IInvoice["id"];
  clientId?: IClient["id"];
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
    gateway?: ActorRef<any>;
  };

  // ---
  autoupdate?: boolean;
  dirty?: boolean;
  error?: any;
}
