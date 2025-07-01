// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { ICustomField } from "@upmind-automation/types";
import type { ResponseError } from "../../../utils";
// -----------------------------------------------------------------------------

export interface FieldsModel {
  notes: string;
  customFields: Record<string, any>;
}

export interface FieldsContext {
  basketId?: string;
  // ---
  fields?: ICustomField[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: FieldsModel;
  autoupdate?: boolean;
  // ---
  dirty?: boolean;
  error?: ResponseError;
  controller?: AbortController;
}
