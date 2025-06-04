// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { ICurrency } from "@upmind-automation/types";
import { ResponseError } from "src/modules/query";

// -----------------------------------------------------------------------------

export type CurrencyModel = {
  id?: ICurrency["id"];
  code?: ICurrency["code"];
};

export interface CurrencyContext {
  basketId?: string;
  // ---
  // TODO:
  // currencies?: ICurrency[];
  currencies?: ICurrency[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  // TODO:
  // model?: ICurrency;
  // baseModel?: ICurrency;
  model?: CurrencyModel;
  baseModel?: any;
  autoupdate?: boolean;
  // ---
  dirty?: boolean;
  error?: ResponseError;
}
