// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";
import type { ICurrency } from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

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
  model?: any;
  baseModel?: any;
  autoupdate?: boolean;
  // ---
  dirty?: boolean;
  // TODO:
  // error?: RequestError;
  error?: any;
}
