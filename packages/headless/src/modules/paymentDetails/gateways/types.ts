// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
// TODO:
// import type { IGateway } from "../../../modules/payment/types";
// import type { GatewayTypes } from "../types";
import type { ICurrency } from "../../../modules/system/types";
import { GatewayTypes as APIGatewayTypes } from "@upmind-automation/types";
import type {
  IAddress,
  GatewayAuthType,
  GatewayStoreType,
  GatewayContext as GatewayCtx,
  IGateway,
  GatewayProviderCodes,
  IGatewayProvider,
} from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

export enum GatewayTypes {
  FREE = -1,
  STORED = 0,
  // ---
  CARD = APIGatewayTypes.CARD,
  BANK_TRANSFER = APIGatewayTypes.BANK_TRANSFER,
  DIRECT_DEBIT = APIGatewayTypes.DIRECT_DEBIT,
  SEPA = APIGatewayTypes.SEPA,
  OFFLINE = APIGatewayTypes.OFFLINE,
  MOBILE = APIGatewayTypes.MOBILE,
  WALLET = APIGatewayTypes.WALLET,
  // PAY_OUT = APIGatewayTypes.PAY_OUT,
  // EXTERNAL_SUBSCRIPTION = APIGatewayTypes.EXTERNAL_SUBSCRIPTION,
  AWAITING_CLIENT = APIGatewayTypes.AWAITING_CLIENT,
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
  address?: IAddress;
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

// --------------------------------------------------------
// Events

export interface GatewayEvent {
  type: "CHECKOUT";
  data?: any;
  error?: any;
}
