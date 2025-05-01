// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../api/types";

// -----------------------------------------------------------------------------

export interface Field {
  notes: string;
  customFields: Record<string, any>;
}

export interface FieldsContext {
  basketId?: string;
  // ---
  fields?: any; //IFields[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: Field;
  autoupdate?: boolean;
  // ---
  dirty?: boolean;
  error?: any;
  controller?: AbortController;
}
