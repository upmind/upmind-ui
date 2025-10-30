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
  gatewayId: IPaymentDetail["gateway_id"];
  id: IPaymentDetail["id"];
  title: IPaymentDetail["name"];
  type: IPaymentDetail["type"];
  meta: {
    isAutoPayment: IPaymentDetail["auto_payment"];
    isActive: boolean;
    isSupported: boolean;
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

export type PaymentDetailData = PaymentDetailModel & {
  //   walletAmount?: number;
  amount?: number;
  data?: SelectPaymentMethodData;
};

export type PaymentDetailModel = {
  type?: Partial<PaymentType> | null;
  gateway_id?: IGateway["id"];
  payment_details_id?: PaymentDetail["id"];
  return_url?: string;
  cancel_url?: string;
};

// For when adding a new payment detail "Add" context
export interface PaymentDetailsAddArgs {
  address: IAddress;
  clientId: IClient["id"];
}

/**
 * Interface representing the arguments required to initialise payment details context.
 * These details provide the necessary context for payment forms and gateway interactions.
 */
export interface PaymentDetailsArgs {
  /**
   * The unique identifier of the order for which payment details are being managed.
   */
  orderId: IOrder["id"];
  /**
   * The unique identifier of the client managing their payment details.
   */
  clientId: IClient["id"];
  /**
   * The {@link ICurrency} object representing the currency of the payment.
   */
  currency: ICurrency;
  /**
   * The {@link IAddress} object representing the billing address associated with the payment.
   */
  address: IAddress;
  /**
   * The total amount of the payment.
   */
  amount: number;
}

/**
 * Interface representing the context for payment details management, typically managed by an XState machine.
 * It extends {@link PaymentDetailsArgs} with a comprehensive set of properties for handling
 * available gateways, payment types, stored methods, wallet balance, form schemas, and error states.
 */
export interface PaymentDetailsContext extends PaymentDetailsArgs {
  // ctx: GatewayCtx; // TODo when we have Add and pay contexts
  // --- lookups
  /**
   * An array of {@link IBrandGateway} objects available for the current brand and client.
   */
  gateways?: IBrandGateway[];
  /**
   * The allowed {@link PaymentType} for the current context.
   */
  paymentTypes?: PaymentType;
  /**
   * An array of stored payment method models available to the client.
   */
  storedPaymentMethods?: PaymentDetail[];
  /**
   * The client's wallet balance details.
   */
  balance?: IWalletBalance;
  /**
   * The currently selected {@link IGateway} object.
   */
  gateway?: IGateway;
  // ---
  /**
   * Optional additional fields relevant to payment processing.
   */
  fields?: any;
  /**
   * The JSON Schema (`JsonSchema`) defining the structure and validation rules for the payment details form.
   */
  schema?: JsonSchema;
  /**
   * The UI Schema (`UISchemaElement`) used to configure the presentation and layout of the payment details form.
   */
  uischema?: UISchemaElement;
  /**
   * The current {@link PaymentDetailModel} representing the user's selection in the payment details form.
   */
  model?: PaymentDetailModel;
  baseModel?: PaymentDetailModel;
  autoupdate?: boolean;
  // --- SPAWNED ACTORS/MACHINES
  gatewayHelper?: ActorRef<any>;
  authHelper?: ActorRef<any>;
  // --- output
  /**
   * The raw response data from the actual payment gateway after a transaction attempt.
   */
  paymentDetail?: PaymentDetailData;
  /**
   * An error object if any issue occurred during payment details operations.
   */
  error?: ResponseError;
  // operationId?: string; TODO when we have more complex operations based on responses and persisted state
}
