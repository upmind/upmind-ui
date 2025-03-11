// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";
import type {
  IAddress,
  IBasket,
  IBrandGateway,
  IClient,
  IOrder,
  ICurrency,
  IGateway,
  IWalletBalance,
  PaymentType,
} from "@upmind-automation/types";
// --------------------------------------------------------

// --------------------------------------------------------
// private

export interface PaymentDetailModel {
  amount: number;
  type?: PaymentType;
  gateway_id?: IGateway["id"];
}

// --------------------------------------------------------
// Contexts

export interface PaymentDetailsArgs {
  orderId: IOrder["id"];
  clientId: IClient["id"];
  currency: ICurrency;
  address: IAddress;
  amount: number;
}

export interface PaymentDetailsContext extends PaymentDetailsArgs {
  // ---
  gateways?: IBrandGateway[];
  payment_types?: PaymentType;
  // ---
  stored_payment_methods?: PaymentDetailModel[];
  balance?: IWalletBalance;
  gateway?: IGateway;
  // ---
  fields?: any;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: PaymentDetailModel;
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
