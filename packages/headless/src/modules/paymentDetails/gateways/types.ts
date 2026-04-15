// --- types
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type {
  GatewayData,
  IAddress,
  IClient,
  ICurrency,
  IGateway,
  IOrder,
  GatewayContext as GatewayCtx
} from "@upmind-automation/types";

import type { ActorRef } from "xstate";
import type { ResponseError } from "../../../utils";
import type { PaymentDetailData } from "../types";

// -----------------------------------------------------------------------------

/**
 * Gateway parameters shared between PAY and ADD contexts.
 *
 * `amount` and `orderId` are required for PAY context, optional for ADD.
 * Downstream gateway services access these without narrowing by `ctx`,
 * so they must remain accessible on the base type.
 */
export type GatewayParams = {
  address?: IAddress;
  /**
   * The numerical amount of the payment (0 or omitted for ADD context).
   */
  amount?: PaymentDetailData["amount"];
  client: IClient;
  /**
   * The {@link GatewayCtx} defining whether the gateway is used for paying or adding a detail.
   */
  ctx: GatewayCtx;
  /**
   * The {@link ICurrency} object relevant to the payment amount.
   */
  currency: ICurrency;
  /**
   * The {@link IGateway} object representing the selected payment gateway.
   */
  gateway: IGateway;
  /**
   * The unique identifier of the order (omitted for ADD context).
   */
  orderId?: IOrder["id"];
  /**
   * `true` if the gateway integration should operate in a renderless mode (no UI from gateway itself).
   */
  renderless?: boolean;
};

/**
 * Gateway parameters for PAY context — requires orderId and amount.
 */
export type GatewayPayParams = GatewayParams & {
  ctx: typeof GatewayCtx.PAY;
  amount: PaymentDetailData["amount"];
  orderId: IOrder["id"];
};

/**
 * Gateway parameters for ADD context — no orderId or amount needed.
 */
export type GatewayAddParams = GatewayParams & {
  ctx: typeof GatewayCtx.ADD;
};

export type GenericGatewayContext = {
  // --- state

  /**
   * The SDK instance provided by the payment gateway for handling payment operations.
   * This allows for direct interaction with the gateway's SDK within the application.
   * NB: Each SDK will have its own type and interface, but will always be added here.
   */
  sdk?: unknown;

  /**
   * The HTML container element where the payment gateway SDK UI should be injected into and rendered.
   */
  container?: HTMLElement;

  /**
   * A function invoked by the gateway machine to observe validation events from SDK specific implementations.
   */
  validationObserver?: ActorRef<any>;

  /**
   * A callback function provided to assist with validation logic.
   * @param callback A function to call with validation results.
   * @returns void
   */
  validationHelper?: (callback: any) => void;

  // --- Settings
  /**
   * `true` if the selected payment method is supported by the Upmind Headless.
   * This allows new/upcoming payment methods to be represented even if not yet supported.
   */
  supported: boolean;
  /**
   * `true` if the selected payment method can be stored for future use.
   */
  canStore?: boolean;
  /**
   * `true` if the selected payment method *must* be stored for future use (e.g. for Direct Debit mandates).
   */
  mustStore?: boolean;
  /**
   * `true` if auto-payment should be enabled for stored payment details.
   */
  mustAutoPay?: boolean;

  // --- UI
  /**
   * The JSON Schema (`JsonSchema`) defining the structure and validation rules for the payment form.
   */
  schema?: JsonSchema;
  /**
   * The UI Schema (`UISchemaElement`) used to configure the presentation and layout of the payment form.
   */
  uischema?: UISchemaElement;
  /**
   * The data model of the payment form, holding user input.
   */
  model?: GatewayData;
  // --- Output
  /**
   * will contain the response from Card, as wel las any model data
   */
  paymentDetail?: PaymentDetailData;
  /**
   * An error object if any issue occurred during payment gateway operations.
   */
  error?: ResponseError;

  // --- ADD context

  /**
   * The client_payment_details_id obtained from beginSetup (ADD context only).
   */
  clientPaymentDetailsId?: string;

  /**
   * The gateway-specific client secret from beginSetup (ADD context only).
   * E.g. Stripe SetupIntent client_secret, Braintree client token, etc.
   */
  clientSecret?: string;
};

export type GatewayContext<T = {}> = GatewayParams & GenericGatewayContext & T;

export enum ZERO_DECIMAL_CURRENCIES {
  BIF = "BIF", // Burundian Franc
  CLP = "CLP", // Chilean Peso
  DJF = "DJF", // Djiboutian Franc
  GNF = "GNF", // Guinean Franc
  JPY = "JPY", // Japanese Yen
  KMF = "KMF", // Comorian Franc
  KRW = "KRW", // South Korean Won
  MGA = "MGA", // Malagasy Ariary
  PYG = "PYG", // Paraguayan Guarani
  RWF = "RWF", // Rwandan Franc
  UGX = "UGX", // Ugandan Shilling
  VND = "VND", // Vietnamese Dong
  VUV = "VUV", // Vanuatu Vatu
  XAF = "XAF", // Central African Franc
  XOF = "XOF", // West African Franc
  XPF = "XPF" // CFP Franc
}
