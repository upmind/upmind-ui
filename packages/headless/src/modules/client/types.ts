// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { BrandConfigKeys, IClient } from "@upmind-automation/types";

// --- internal
import type { ActorRef } from "xstate";
import type { QueryKey } from "@tanstack/vue-query";
import { QueryResponseError } from "../query";
import { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
// Contexts

export interface ClientItemContext<TModel = any, TBaseModel = any> {
  id?: string;

  title?: string;
  description?: string;
  // ---
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  baseModel?: TBaseModel;
  model?: TModel;
  error?: QueryResponseError | ErrorObject[];
  // ---
  autoupdate?: boolean;
  allowMultipleEdits?: boolean;
  // ---
  config?: Record<BrandConfigKeys, boolean>;
}
