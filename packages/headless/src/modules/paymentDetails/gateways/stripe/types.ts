// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";

// --- types
import type { ICurrency } from "@upmind-automation/types";
import type { IGateway, GatewayTypes } from "../types";
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
  basket_id?: string;
  currency?: ICurrency;
  address?: any; // IAdress
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
