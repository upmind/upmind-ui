// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IBillingDetail {
  address_id?: string;
  company_id?: string;
}

// --------------------------------------------------------
// Contexts

export interface BillingDetailsContext {
  basket_id?: string;
  client_id?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IBillingDetail;
  // ---
  addresses?: any[];
  companies?: any[];
  // ---
  autoupdate?: boolean;
  dirty?: boolean;
  // TODO:
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface BillingDetailsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IBillingDetail;
  // TODO:
  // error?: RequestError;
  error?: any;
}
