// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
import type { IGateway } from "@/modules/payment/types.d";
import type { ICurrency } from "@/modules/system/types.d";
import type { GatewayTypes } from "../services";
import type { GatewayContext } from "./types.d";

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
  VIEW = "view"
}
// --------------------------------------------------------
// private

export interface IGateway {
  allow_manual_store: boolean;
  card_types: ICardType[];
  client?: IClient;
  countries?: ICountry[];
  created_at: string;
  currencies: IGatewayCurrency[];
  deleted_at: null | string;
  gateway_provider: IGatewayProvider;
  gateway_provider_id: IGatewayProvider["id"];
  gateway_settings: IGatewaySetting[];
  id: string;
  is_stored: string;
  name: string;
  name_translated: string;
  next_action: { url: string; method: string; fields: { [key: string]: any } };
  oauth_application_access_token_id: number;
  org_id: IOrg["id"];
  payment_instructions: string;
  payment_instructions_translated: string;
  payment_type: IPaymentType;
  provider: string;
  sca_verified: boolean;
  store_on_payment: boolean;
  store_on_payment_force: boolean;
  store_outside_payment: boolean;
  translations: ITranslation[];
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
  fields: IGatewayProviderField[];
  id: string;
  instructions: string;
  logos?: ILogo[];
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

export interface GatewayContext {
  card?: any;
  elements?: any;
  element?: any;
  renderer?: Function;
  // ---
  basket_id?: string;
  gateway?: IGateway;
  ctx?: GatewayContext;
  amount?: number;
  currency?: ICurrency;
  type?: GatewayTypes;
  // --- Operation
  operation_id?: string;
  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IBillingDetail;
  // --- Output
  paymentDetails?: any; // will contain the response from Card, as wel las any model data
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface GatewayEvent {
  type: "CHECKOUT";
  data?: any;
  error?: RequestError;
}
