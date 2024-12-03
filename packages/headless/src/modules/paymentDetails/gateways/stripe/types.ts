// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
import type { IGateway } from "../../../../modules/paymentDetails/gateways/types";
import type { ICurrency } from "../../../../modules/system/types";
import type {
  GatewayContext,
  GatewayTypes,
} from "../../../../modules/paymentDetails/gateways/types";

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
  address?: any; // IAdress
  amount?: number;
  gateway?: IGateway;
  renderless?: boolean;
  // ---
  ctx?: GatewayContext;
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
  uierrors?: any;
}

// --------------------------------------------------------
// Events

export interface StripeEvent {
  type: "CHECKOUT";
  data?: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
