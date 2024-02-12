// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IPromotion {
  notes: string;
  custom_fields: Record<string, any>;
}

// --------------------------------------------------------
// Contexts

export interface PromotionsContext {
  // ---
  fields?: Array;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IField;
  // ---
  dirty: Boolean;
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface PromotionsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IField;
  error?: RequestError;
}
