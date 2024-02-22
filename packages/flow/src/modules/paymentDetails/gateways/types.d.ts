// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
import type { IGateway } from "@/modules/payment/types.d";
import type { ICurrency } from "@/modules/system/types.d";
import type { GatewayTypes } from "../services";
import type { GatewayContext } from "./types.d";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

export interface GatewayContext {
  card?: any;
  elements?: any;
  element?: any;
  renderer?: Function;
  // ---
  gateway?: IGateway;
  ctx?: GatewayContext;
  amount?: number;
  currency?: ICurrency;
  type?: GatewayTypes;

  // --- UI
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IBillingDetail;
  // --- Output
  paymentDetails?: any; // will contain the response from Card, as wel las any model data
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface GatewayEvent {
  type: "CHECKOUT";
  data?: any;
  error?: RequestError;
}
