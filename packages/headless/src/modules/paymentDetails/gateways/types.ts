// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
import { GatewayTypes } from "@upmind-automation/types";
import type {
  GatewayData,
  IAddress,
  IClient,
  ICurrency,
  IGateway,
  IOrder,
  PaymentMethodType,
  SelectedPaymentMethod,
  GatewayContext as GatewayCtx
} from "@upmind-automation/types";

import type { ResponseError } from "../../../utils";
import { PaymentDetail } from "../types";

// -----------------------------------------------------------------------------

export type BaseGatewayContext = {
  card?: any;
  elements?: any;
  element?: any;
  container?: HTMLElement;
  renderer?: (container: HTMLElement) => void;

  // ---
  address?: IAddress;
  amount: SelectedPaymentMethod["amount"];
  clientId: IClient["id"];
  ctx: GatewayCtx;
  currency: ICurrency;
  gateway: IGateway;
  orderId: IOrder["id"];
  paymentMethod: PaymentMethodType;
  type: GatewayTypes;
  // --- Lookups
  storedPaymentMethods?: PaymentDetail[];
  code?: string;
  // --- Computed
  renderless?: boolean;
  canStore?: boolean;
  mustStore?: boolean;
  mustAutoPay?: boolean;
  // --- Operation
  operationId?: string;
  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: GatewayData;
  // --- Output
  paymentDetails?: SelectedPaymentMethod; // will contain the response from Card, as wel las any model data
  // ---
  error?: ResponseError;
};

export type GatewayContext<T = {}> = BaseGatewayContext & T;
