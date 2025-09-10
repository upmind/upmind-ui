// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
// TODO:
import { GatewayTypes } from "@upmind-automation/types";
import type {
  IAddress,
  ICurrency,
  IGateway,
  IOrder
} from "@upmind-automation/types";

import type { ResponseError } from "../../../utils";

// -----------------------------------------------------------------------------

export enum GatewayTypesExtended {
  FREE = -1,
  STORED = 0
}

export enum GatewayCtx {
  PAY = "pay", // PAY = Gateways are shown in the context of making a payment (invoice, topup etc)
  ADD = "add" // ADD = Gateways are shown in the context of adding a stored payment detail
}

// TODO:
export interface GatewayContext {
  card?: any;
  elements?: any;
  element?: any;
  container?: HTMLElement;
  renderer?: (container: HTMLElement) => void;

  // ---
  currency: ICurrency;
  amount: number;
  orderId: IOrder["id"];
  address?: IAddress;
  gateway?: IGateway;
  // ---
  type?: GatewayTypes | GatewayTypesExtended;
  ctx?: GatewayCtx;
  storedPaymentMethods?: any[];
  code?: string;

  // ---
  renderless?: boolean;
  canStore?: boolean;
  mustStore?: boolean;
  mustAutoPay?: boolean;
  // --- Operation
  operationId?: string;
  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  // model?: IBillingDetail;
  model?: any;
  // --- Output
  paymentDetails?: any; // will contain the response from Card, as wel las any model data
  // ---
  error?: ResponseError;
}
