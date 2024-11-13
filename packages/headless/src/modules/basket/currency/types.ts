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
  basketId?: String;
  // ---
  currencies?: ICurrency[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: ICurrency;
  baseModel?: ICurrency;
  // ---
  dirty?: Boolean;
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface CurrencyEvent {
  type: "UPDATE" | "CLEAR" | "SET" | "RETRY";
  data?: ICurrency;
  error?: RequestError;
}
