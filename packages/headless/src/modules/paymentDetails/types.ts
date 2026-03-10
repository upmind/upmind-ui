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
  IWalletCurrencyBalance,
  PaymentType,
  SelectPaymentMethodData
} from "@upmind-automation/types";

// --- utils
import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

export type AccountCredit = {
  owned: {
    value: number;
    amount: string;
  };
  credit: {
    value: number;
    amount: string;
  };
  total: {
    value: number;
    amount: string;
  };
};

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

export type PaymentDetailData = Omit<PaymentDetailModel, "type"> &
  SelectPaymentMethodData;

export type PaymentDetailModel = {
  amount: number;
  type: Partial<PaymentType> | null;
  wallet_amount?: number;
  gateway_id?: IGateway["id"];
  payment_details_id?: PaymentDetail["id"];
  return_url?: string;
  cancel_url?: string;
};

// For when adding a new payment detail "Add" context
export interface PaymentDetailsAddArgs {
  address: IAddress;
  client: IClient;
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

  /** The status of the order, this determines if we har draft/paid/partially paid, etc */
  orderStatus: IOrder["status"]["code"];
  /**
   * The unique identifier of the client managing their payment details.
   */
  client: IClient;
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

  /**
   * The amount already paid on this order. Used to determine if this is a
   * settlement (retry/partial) — when > 0, "Pay Later" is disabled.
   */
  paidAmount?: number;

  /**
   * The partial amount set by the user to pay (if applicable).
   * We need this to handle model amount logic when partial payments are allowed and if basket amounts change die to other factors (e.g., discounts, gift cards, etc.)
   */
  amountPartial?: number;

  /**
   * The Wallet amount set by the user to pay (if applicable). We only set this when the user explicitly chooses to use SOME wallet funds and not pay the full balance.
   */
  amountWallet?: number;
}

/**
 * Interface representing the context for payment details management, typically managed by an XState machine.
 * It extends {@link PaymentDetailsArgs} with a comprehensive set of properties for handling
 * available gateways, payment types, stored methods, wallet balance, form schemas, and error states.
 */
export interface PaymentDetailsContext extends PaymentDetailsArgs {
  // ctx: GatewayCtx; // TODo when we have Add and pay contexts

  /**
   * An array of stored payment method models available to the client.
   * This will return ALL the clients stored payment methods UNFILTERED
   */
  raw: {
    accountCredit?: AccountCredit;
    storedPaymentMethods?: PaymentDetail[];
    gateways?: IBrandGateway[];
    config?: Record<string, any>;
  };
  /**
   * Lookups for various payment related data.
   * Includes account credit, available gateways, payment types, and stored payment methods.
   *
   */
  lookups: {
    /**
     * The client's wallet balance {@link AccountCredit} details.
     */
    accountCredit?: AccountCredit;

    amountsFormatted: {
      /**
       * The total payment amount (model.amount) formatted as per locale and currency.
       * This represents the full/partial payment amount that needs to be paid.
       */
      amount: string;

      /**
       * The full outstanding balance (context.amount) formatted as per locale and currency.
       * This represents the total amount due on the order before any partial payment.
       */
      outstanding: string;

      /**
       * The account credit/wallet amount (model.wallet_amount) formatted as per locale and currency.
       * This represents the amount being paid from the customer's credit balance.
       */
      wallet: string;
    };

    /**
     * An array of {@link IBrandGateway} objects available for the current brand and client.
     */
    gateways?: IBrandGateway[];

    /**
     * The allowed {@link PaymentType} for the current context.
     */
    paymentTypes?: Record<string, PaymentType>;

    /**
     * An array of stored payment methods {@link PaymentDetail} available to the client, filtered for Currency and Gateway
     */
    storedPaymentMethods?: PaymentDetail[];
  };

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
  model: PaymentDetailModel;

  /**Flag to indicate if we should try automatially process our payment details subject to being valid */
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
