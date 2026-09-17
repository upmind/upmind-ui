import type { ResponseError } from "../../utils";
import type { CustomField } from "../client-custom-fields";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
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
}
