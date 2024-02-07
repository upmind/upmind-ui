// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IWalletBalance {
  offline: { [key: string]: IWalletCurrencyBalance };
  online: { [key: string]: IWalletCurrencyBalance };
  total: { [key: string]: IWalletCurrencyBalance };
}

export interface IWalletCurrencyBalance {
  amount: number;
  amount_formatted: string;
  amount_converted: number;
  amount_converted_formatted: string;
}

export interface IGateway {
  allow_manual_store: boolean;
  card_types: ICardType[];
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

export interface IPaymentDetail {
  active: boolean;
  address: IAddress;
  address_id: string;
  allow_bacs: null | string;
  allow_cheque: null | string;
  can_delete: boolean;
  card_cvv: null | string;
  card_expire_date: string;
  card_last4: string;
  card_num: null | string;
  card_token: string;
  card_type: string;
  client_id: string;
  created_at: string;
  currency_id: string;
  default: boolean;
  gateway_id: string;
  gateway: IGateway;
  id: string;
  import_id: string;
  name: null | string;
  sepadd_bic: null | string;
  sepadd_iban: null | string;
  staged_import: boolean;
  type: number;
  ukdd_account_number: null | string;
  ukdd_account_sortcode: null | string;
  updated_at: string;
  user_id: string;
  sca_verified: boolean;
  next_action: {
    url: string;
  };
  auto_payment: boolean;
}

// --------------------------------------------------------
// Contexts

export interface PaymentDetailsContext {
  // ---
  gateways?: Array<IGateway>;
  payment_details?: Array<IPaymentDetail>;
  balance?: IWalletBalance;

  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IPaymentDetail;
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface PaymentDetailsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IPaymentDetail;
  error?: RequestError;
}
