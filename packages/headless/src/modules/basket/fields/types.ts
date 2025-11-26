// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { ResponseError } from "../../../utils";
import { CustomField } from "../../client";
// -----------------------------------------------------------------------------

export interface FieldsModel {
  notes: string;
  customFields: Record<string, any>;
}

export interface FieldsContext {
  basketId?: string;
  // ---
  fields?: CustomField[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: FieldsModel;
  baseModel?: FieldsModel;
  autoupdate?: boolean;
  // ---
  error?: ResponseError;
  controller?: AbortController;
}
