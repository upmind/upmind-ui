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
  GatewayContext as GatewayCtx
} from "@upmind-automation/types";

import type { ResponseError } from "../../../utils";
import { PaymentDetailData } from "../types";
import { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
export type GatewayParams = {
  address?: IAddress;
  amount: PaymentDetailData["amount"];
  clientId: IClient["id"];
  ctx: GatewayCtx;
  currency: ICurrency;
  gateway: IGateway;
  orderId: IOrder["id"];
  renderless?: boolean;
};
export type GenericGatewayContext = {
  // --- state
  sdk?: unknown;
  container?: HTMLElement;
  validationObserver?: ActorRef<any>;
  validationHelper?: (callback: any) => void;
  // --- Settings
  supported: boolean;
  canStore?: boolean;
  mustStore?: boolean;
  mustAutoPay?: boolean;

  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: GatewayData;
  // --- Output
  paymentDetail?: PaymentDetailData; // will contain the response from Card, as wel las any model data
  error?: ResponseError;
};

export type GatewayContext<T = {}> = GatewayParams & GenericGatewayContext & T;
