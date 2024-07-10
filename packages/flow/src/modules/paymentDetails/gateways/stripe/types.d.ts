// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
import type { IGateway } from "@/modules/payment/types.d";
import type { ICurrency } from "@/modules/system/types.d";
import type { GatewayContext, GatewayTypes } from "../../types.d";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

export interface StripeContext {
  stripe?: any;
  elements?: any;
  element?: any;
  renderer?: Function;
  // ---
  basket_id?: string;
  currency?: ICurrency;
  amount?: number;
  gateway?: IGateway;
  renderless?: boolean;
  // ---
  ctx?: GatewayContext;
  type?: GatewayTypes;

  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IBillingDetail;
  // --- Output
  paymentDetails?: any; // will contain the response from Stripe, as wel las any model data
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface StripeEvent {
  type: "CHECKOUT";
  data?: any;
  error?: RequestError;
}
