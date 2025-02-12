// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
// TODO:
import { GatewayTypes as GatewayTypesEnum } from "@upmind-automation/types";
import type {
  ICurrency,
  GatewayAuthType,
  GatewayStoreType,
} from "@upmind-automation/types";

// --------------------------------------------------------
// ENUMS

export enum GatewayTypes {
  FREE = -1,
  STORED = 0,
  // ---
  CARD = GatewayTypesEnum.CARD,
  BANK_TRANSFER = GatewayTypesEnum.BANK_TRANSFER,
  DIRECT_DEBIT = GatewayTypesEnum.DIRECT_DEBIT,
  SEPA = GatewayTypesEnum.SEPA,
  OFFLINE = GatewayTypesEnum.OFFLINE,
  MOBILE = GatewayTypesEnum.MOBILE,
  WALLET = GatewayTypesEnum.WALLET,
}

export enum GatewayCtx {
  PAY = "pay", // PAY = Gateways are shown in the context of making a payment (invoice, topup etc)
  ADD = "add", // ADD = Gateways are shown in the context of adding a stored payment detail
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
  ctx?: GatewayCtx;
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
