// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
// TODO:
// import type { IGateway } from "../../../modules/payment/types";
// import type { GatewayTypes } from "../types";
import type { ICurrency } from "../../../modules/system/types";

// --------------------------------------------------------
// ENUMS

export enum QUERY_PARAMS {
  ABORT = "abort",
  ACCOUNT_ID = "aid",
  ATTEMPT = "attempt",
  AUTHORIZATION_UUID = "authorization_uuid",
  AUTO_PAY = "auto_pay",
  BASKET_ID = "bid",
  BASKET_PRODUCT_ID = "bpid",
  BILLING_CYCLE_MONTHS = "bcm",
  CATEGORY_ID = "catid",
  CLIENT_ID = "client_id",
  COUPONS = "coupons",
  CROSS_SELL_PRODUCT = "csp",
  CURRENCY = "curr",
  CURRENCY_CODE = "currency",
  CURRENCY_ID = "currId",
  DATE = "date",
  EMAIL_ID = "email_id",
  FAILED = "failed",
  GATEWAY_PROVIDER_ID = "gpid",
  HASH = "hash",
  INIT = "init",
  INIT_PAY = "init_pay",
  MODAL_REQUEST_ID = "modal_request_id",
  OPERATION_ID = "operation_id",
  ORDER_ID = "oid",
  ORDER_TEMPLATE_CODE = "order_template_code",
  PAYMENT_DETAILS_ID = "payment_details_id",
  PAYMENT_METHOD_TYPE = "pmt",
  PAYMENT_SUCCESS = "payment_success",
  PRODUCT_FIELDS = "pfields",
  PRODUCT_ID = "pid",
  QUANTITY = "qty",
  READ_MORE = "read_more",
  SEARCH = "search",
  STORE_SUCCESS = "store_success",
  SUBPRODUCT_IDS = "sub_pids",
  SUBPRODUCT_QUANTITY = "subproduct_qty",
  SUCCESS = "success",
  USERNAME = "username",
  VIEW = "view",
}

export enum GatewayTypes {
  FREE = -1,
  STORED = 0,
  // ---
  CARD = 1,
  BANK_TRANSFER = 2,
  DIRECT_DEBIT = 3,
  SEPA = 4,
  OFFLINE = 5,
  MOBILE = 6,
  WALLET = 7,
}

export enum GatewayAuthType {
  NONE = "none",
  SETTINGS = "settings",
  OAUTH2 = "oauth2",
}

export enum GatewayStoreType {
  /**
   * none (gateway does NOT support stored payment details)
   */
  NONE = "none",
  /**
   * either (gateway supports one-off payments + stored payment details)
   */
  EITHER = "either",
  /**
   * always (gateway does NOT support one-off payments; stored payment details only) - this is the case for GoCardless where an agreement (mandate) must be set up first
   */
  ALWAYS = "always",
}

export enum GatewayCtx {
  PAY = "pay", // PAY = Gateways are shown in the context of making a payment (invoice, topup etc)
  ADD = "add", // ADD = Gateways are shown in the context of adding a stored payment detail
}

export enum GatewayProviderCodes {
  STRIPE = "Stripe_PaymentIntents",
}

// --------------------------------------------------------
// private

// TODO:
export interface IGateway {
  allow_manual_store: boolean;
  // card_types: ICardType[];
  card_types: any[];
  // client?: IClient;
  client?: any;
  // countries?: ICountry[];
  countries?: any[];
  created_at: string;
  // currencies: IGatewayCurrency[];
  currencies: any[];
  deleted_at: null | string;
  gateway_provider: IGatewayProvider;
  gateway_provider_id: IGatewayProvider["id"];
  // gateway_settings: IGatewaySetting[];
  gateway_settings: any[];
  id: string;
  is_stored: string;
  name: string;
  name_translated: string;
  next_action: { url: string; method: string; fields: { [key: string]: any } };
  oauth_application_access_token_id: number;
  // org_id: IOrg["id"];
  org_id: any["id"];
  payment_instructions: string;
  payment_instructions_translated: string;
  // payment_type: IPaymentType;
  payment_type: any;
  provider: string;
  sca_verified: boolean;
  store_on_payment: boolean;
  store_on_payment_force: boolean;
  store_outside_payment: boolean;
  // translations: ITranslation[];
  translations: any[];
  type: GatewayTypes;
  updated_at: string;
  use_frontend_implementation?: boolean;
}

export interface IGatewayProvider {
  auth_type: GatewayAuthType;
  code: string;
  created_at: string;
  display_fields: null;
  external_payment: boolean;
  external_store: boolean;
  // fields: IGatewayProviderField[];
  fields: any[];
  id: string;
  instructions: string;
  // logos?: ILogo[];
  logos?: any[];
  name: string;
  name_translated: null | string;
  needs_address: boolean;
  oauth_application_code: string;
  requires_name: boolean;
  short_description: null | string;
  short_description_translated: null | string;
  store_type: GatewayStoreType;
  translations: string[];
  type: GatewayTypes;
  updated_at: string;
}

// --------------------------------------------------------
// Contexts

// TODO:
export interface GatewayContext {
  card?: any;
  elements?: any;
  element?: any;
  renderer?: Function;
  // ---
  basketId?: string;
  currency?: ICurrency;
  amount?: number;
  gateway?: IGateway;
  // ---
  type?: GatewayTypes;
  ctx?: GatewayContext;
  stored_payment_methods?: Array<any>;
  code?: string;

  // ---
  renderless?: boolean;
  can_store?: boolean;
  must_store?: boolean;
  must_auto_pay?: boolean;
  // --- Operation
  operation_id?: string;
  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  // model?: IBillingDetail;
  model?: any;
  // --- Output
  paymentDetails?: any; // will contain the response from Card, as wel las any model data
  // ---
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface GatewayEvent {
  type: "CHECKOUT";
  data?: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
