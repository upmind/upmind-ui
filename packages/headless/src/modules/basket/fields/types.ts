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
  basket_id?: String;
  // ---
  // TODO:
  // fields?: Array;
  fields?: any[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IField;
  // ---
  dirty?: Boolean;
  // TODO:
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface FieldsEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: IField;
  // TODO:
  // error?: RequestError;
  error?: any;
}
