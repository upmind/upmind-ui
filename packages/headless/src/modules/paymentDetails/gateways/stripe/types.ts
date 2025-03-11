// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";

// --- types
import type {
  ICurrency,
  IGateway,
  IAddress,
  IPayment,
  IPaymentDetail,
  IOrder,
} from "@upmind-automation/types";
import type { GatewayTypes } from "../types";
import type { GatewayCtx, GatewayContext } from "../types";

// --------------------------------------------------------
// Contexts

export interface StripeContext extends GatewayContext {
  stripe?: any;
  elements?: any;
  element?: any;
  elementStatus?: any;
  renderer?: (status: any) => void;
  validationObserver: ActorRef<any>;
  clientPaymentDetailsId?: string;
  clientSecret?: string;
  // ---
  orderId?: IOrder["id"];
  currency?: ICurrency;
  address?: IAddress;
  amount?: number;
  gateway?: IGateway;
  renderless?: boolean;
  // ---
  ctx?: GatewayCtx;
  type?: GatewayTypes;

  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  // TODO:
  // model?: IBillingDetail;
  model?: any;
  // --- Output
  paymentDetails?: any; // will contain the response from Stripe, as wel las any model data
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}
