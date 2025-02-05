// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";
export type { ICurrency } from "../../system/types";
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
  currencies?: any[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  // TODO:
  // model?: ICurrency;
  // baseModel?: ICurrency;
  model?: any;
  baseModel?: any;
  // ---
  dirty?: Boolean;
  // TODO:
  // error?: RequestError;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface CurrencyEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  // TODO:
  // data?: ICurrency;
  data?: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
