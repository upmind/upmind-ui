// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";

// --- types
import type {
  ICurrency,
  IGateway,
  IAddress,
  IPayment,
  IPaymentDetail,
  IOrder,
} from "@upmind-automation/types";
import { ErrorObject } from "ajv";
import type { GatewayTypes } from "../types";
import type { GatewayCtx, GatewayContext } from "../types";
import { QueryResponseError } from "../../../query";

// -----------------------------------------------------------------------------

export enum STRIPE_QUERY_PARAMS {
  STRIPE_REDIRECT_STATUS = "redirect_status",
  STRIPE_SETUP_INTENT = "setup_intent",
  STRIPE_SETUP_INTENT_CLIENT_SECRET = "setup_intent_client_secret",
}

// NYS = "Not Yet Supported"

export enum STRIPE_PAYMENT_METHOD_TYPES {
  ACSS_DEBIT = "acss_debit", // NYS
  AFFIRM = "affirm", // NYS
  AFTERPAY_CLEARPAY = "afterpay_clearpay", // NYS
  ALIPAY = "alipay", // NYS
  AU_BECS_DEBIT = "au_becs_debit", // NYS
  BACS_DEBIT = "bacs_debit", // NYS
  BANCONTACT = "bancontact", // NYS
  BLIK = "blik", // NYS
  BOLETO = "boleto", // NYS
  CARD = "card",
  CASHAPP = "cashapp", // NYS
  EPS = "eps", // NYS
  FPX = "fpx", // NYS
  GIROPAY = "giropay", // NYS
  GRABPAY = "grabpay", // NYS
  IDEAL = "ideal", // NYS
  KLARNA = "klarna", // NYS
  KONBINI = "konbini", // NYS
  OXXO = "oxxo", // NYS
  P24 = "p24", // NYS
  PAYNOW = "paynow", // NYS
  PAYPAL = "paypal",
  PIX = "pix", // NYS
  PROMPTPAY = "promptpay", // NYS
  SEPA_DEBIT = "sepa_debit", // NYS
  SOFORT = "sofort", // NYS
  US_BANK_ACCOUNT = "us_bank_account", // NYS
  WECHAT_PAY = "wechat_pay", // NYS
}

export interface StripeContext extends GatewayContext {
  stripe?: any;
  elements?: any;
  element?: any;
  elementStatus?: any;
  renderer?: (status: any) => void;
  validationObserver: ActorRef<any>;
  clientPaymentDetailsId?: string;
  clientSecret?: string;
  // ---
  orderId?: IOrder["id"];
  currency?: ICurrency;
  address?: IAddress;
  amount?: number;
  gateway?: IGateway;
  renderless?: boolean;
  // ---
  ctx?: GatewayCtx;
  type?: GatewayTypes;

  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  // TODO:
  // model?: IBillingDetail;
  model?: any;
  // --- Output
  paymentDetails?: any; // will contain the response from Stripe, as wel las any model data
  // ---
  error?: QueryResponseError | ErrorObject[];
}
