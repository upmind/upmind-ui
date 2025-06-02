// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { ResponseError } from "src/modules/query";

// --- internal

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
  error?: ResponseError;
  controller?: AbortController;
}
