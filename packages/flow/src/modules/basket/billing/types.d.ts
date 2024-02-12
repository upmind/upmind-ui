// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IBillingDetail {
  notes: string;
  custom_fields: Record<string, any>;
}

// --------------------------------------------------------
// Contexts

export interface BillingDetailsContext {
  // ---
  fields?: Array;
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
