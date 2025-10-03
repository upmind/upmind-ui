// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";

// --- internal
import type {
  GatewayTypes,
  IAddress,
  IBrandGateway,
  IClient,
  ICurrency,
  IGateway,
  IOrder,
  IPaymentDetail,
  IWalletBalance,
  PaymentType,
  SelectPaymentMethodData
} from "@upmind-automation/types";
import { GatewayCtx } from "./gateways/types";

// --- utils
import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

export type PaymentDetail = {
  name: IPaymentDetail["name"];
  addressId: IPaymentDetail["address_id"];
  cardCvv: IPaymentDetail["card_cvv"];
  cardExpireDate: IPaymentDetail["card_expire_date"];
  cardLast4: IPaymentDetail["card_last4"];
  cardNum: IPaymentDetail["card_num"];
  cardToken: IPaymentDetail["card_token"];
  cardType: IPaymentDetail["card_type"];
  clientId: IPaymentDetail["client_id"];
  currency: Partial<IPaymentDetail["currency"]>; // with relation
  gatewayID: IPaymentDetail["gateway_id"];
  id: IPaymentDetail["id"];
  title: IPaymentDetail["name"];
  type: IPaymentDetail["type"];
  meta: {
    isAutoPayment: IPaymentDetail["auto_payment"];
    isActive: boolean;
    canDelete: boolean;
    isDefault: boolean;
  };
};

export type Gateway = {
  cardTypes: IGateway["card_types"];
  currencies: IGateway["currencies"];
  gatewayProvider: IGateway["gateway_provider"];
  gatewaySettings: IGateway["gateway_settings"];
  id: IGateway["id"];
  instructions: IGateway["payment_instructions"];
  paymentType: IGateway["payment_type"];
  provider: IGateway["provider"];
  title: IGateway["name"];
  type: GatewayTypes;
  meta: {
    isStored: boolean;
    canStore: boolean;
    mustStore: boolean;
    useFrontendImplementation?: boolean;
  };
};

export interface PaymentDetailModel {
  type?: Partial<PaymentType>;
  gateway_id?: IGateway["id"];
  payment_details_id?: PaymentDetail["id"];
  return_url?: string;
  cancel_url?: string;
}

// For when adding a new payment detail "Add" context
export interface PaymentDetailsAddArgs {
  address: IAddress;
  clientId: IClient["id"];
}

// For when adding a new payment detail "Pay" context
export interface PaymentDetailsArgs {
  orderId: IOrder["id"];
  clientId: IClient["id"];
  currency: ICurrency;
  address: IAddress;
  amount: number;
}

export interface PaymentDetailsContext extends PaymentDetailsArgs {
  ctx: GatewayCtx;
  gateways?: IBrandGateway[];
  paymentTypes?: PaymentType;
  // ---
  storedPaymentMethods?: PaymentDetail[];
  balance?: IWalletBalance;
  gateway?: IGateway;
  // ---
  fields?: any;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: PaymentDetailModel;
  baseModel?: PaymentDetailModel;
  // ---
  mount?: HTMLElement;
  paymentDetails?: SelectPaymentMethodData; // This is the response from the actual payment gateway(s)
  // --- SPAWNED ACTORS/MACHINES
  actors: {
    gateway?: ActorRef<any>;
  };
  authHelper?: ActorRef<any>;

  // ---
  autoupdate?: boolean;
  error?: ResponseError;
}
