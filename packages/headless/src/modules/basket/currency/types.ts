// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
export type { ICurrency } from "../../system/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

export interface CurrencyContext {
  basket_id?: String;
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
