// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { QueryResponseError } from "src/modules/query";

// --- internal
import type { ICustomField } from "@upmind-automation/types";
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
  error?: QueryResponseError;
  controller?: AbortController;
}
