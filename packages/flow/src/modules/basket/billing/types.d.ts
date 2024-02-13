// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

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
  basketId?: string;
  address_id?: string;
  company_id?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IBillingDetail;
  // ---
  dirty: Boolean;
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface BillingDetailsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IBillingDetail;
  error?: RequestError;
}
