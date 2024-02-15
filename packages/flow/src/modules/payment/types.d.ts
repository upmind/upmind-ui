// --- extrnal

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// interfaces

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

export interface IPayment {}

// --------------------------------------------------------
// Contexts

export interface PaymentContext {
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface PaymentEvent {
  type: "PROCESS" | "CANCEL" | "RETRY";
  data?: IPayment;
  error?: RequestError;
}
