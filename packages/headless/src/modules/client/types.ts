// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { BrandConfigKeys, IClient } from "@upmind-automation/types";

// --- internal
import type { ErrorObject } from "ajv";
import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------
// Contexts

export interface ClientItemContext<TModel = any, TBaseModel = any> {
  clientId?: IClient["id"]; // allow for an override of the current client
  id?: string;

  title?: string;
  description?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  baseModel?: TBaseModel;
  model?: TModel;
  error?: ResponseError | ErrorObject[];
  // ---
  autoupdate?: boolean;
  allowMultipleEdits?: boolean;
  // ---
  config?: Record<BrandConfigKeys, boolean>;
}
