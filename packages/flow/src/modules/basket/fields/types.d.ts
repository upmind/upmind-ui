// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IField {
  notes: string;
  custom_fields: Record<string, any>;
}

// --------------------------------------------------------
// Contexts

export interface FieldsContext {
  // ---
  fields?: Array;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IField;
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface FieldsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IField;
  error?: RequestError;
}
