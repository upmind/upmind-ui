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
import { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
export type GatewayParams = {
  address?: IAddress;
  amount: SelectedPaymentMethod["amount"];
  clientId: IClient["id"];
  ctx: GatewayCtx;
  currency: ICurrency;
  gateway: IGateway;
  orderId: IOrder["id"];
  renderless?: boolean;
  // paymentMethod: PaymentMethodType;
  // type: GatewayTypes;
};
export type GeneticGatewayContext = {
  // --- state
  sdk?: unknown;
  container?: HTMLElement;
  validationObserver?: ActorRef<any>;
  validationHelper?: (callback: any) => void;
  // --- Computed
  canStore?: boolean;
  mustStore?: boolean;
  mustAutoPay?: boolean;
  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: GatewayData;
  // --- Output
  paymentDetails?: SelectedPaymentMethod; // will contain the response from Card, as wel las any model data
  error?: ResponseError;
};

export type GatewayContext<T = {}> = GatewayParams & GeneticGatewayContext & T;
