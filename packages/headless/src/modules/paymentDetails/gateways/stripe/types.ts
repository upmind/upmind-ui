// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- types
import type { RequestError } from "../api/types";
import type { IGateway } from "@/modules/payment/types";
import type { ICurrency } from "@/modules/system/types";
import type { GatewayContext, GatewayTypes } from "../../types";

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
  address?: StripeAddress;
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

export interface StripeAddress {
  postal_code: string;
  address_1: string;
  address_2: string;
  address_id: string;
  can_delete: boolean;
  city: string;
  client_id: string;
  company_details: boolean;
  country_id: string;
  default: boolean;
  email: string;
  id: string;
  manualPlace: boolean;
  name: string;
  postcode: string;
  region_id?: string;
  type: number;
  verified: number;
}
