// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
// TODO:
import { GatewayTypes as GatewayTypesEnum } from "@upmind-automation/types";
import type {
  ICurrency,
  IGateway,
  IOrder,
  GatewayAuthType,
  GatewayStoreType,
  IPayment,
  IPaymentDetail,
} from "@upmind-automation/types";
import { ErrorObject } from "ajv";
import { ResponseError } from "src/modules/query";

// -----------------------------------------------------------------------------

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

// TODO:
export interface GatewayContext {
  card?: any;
  elements?: any;
  element?: any;
  renderer?: Function;
  // ---
  orderId?: IOrder["id"];
  currency?: ICurrency;
  amount?: number;
  gateway?: IGateway;
  // ---
  type?: GatewayTypes;
  ctx?: GatewayCtx;
  stored_payment_methods?: any[];
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
  error?: ResponseError | ErrorObject[];
}
