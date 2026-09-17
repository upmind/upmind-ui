import type { ResponseError } from "../../utils";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { IClient } from "@upmind-automation/types";
import type { BrandConfigKeys } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// Contexts

export interface DataManagerContext<TModel = any, TBaseModel = any> {
  clientId?: IClient["id"]; // allow for an override of the current client
  id?: string;

  title?: string;
  description?: string;
  lookups?: Record<string, any[]>;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  baseModel?: TBaseModel;
  model?: TModel;
  error?: ResponseError;
  // ---
  autoupdate?: boolean;
  allowMultipleEdits?: boolean;
  // ---
  config?: Record<BrandConfigKeys, boolean>;
}
