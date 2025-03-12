// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../api/types";
// ---  ENUMS

// ---  private

export interface IField {
  notes: string;
  customFields: Record<string, any>;
}

// ---  Contexts

export interface FieldsContext {
  basketId?: string;
  // ---
  fields?: any; //IFields[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IField;
  autoupdate?: boolean;
  // ---
  dirty?: boolean;
  error?: any;
}
