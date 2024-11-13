// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { RequestError } from "../..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IPromotion {
  code: string;
}

// --------------------------------------------------------
// Contexts

export interface PromotionsContext {
  basketId?: string;
  // ---
  promotions?: IPromotion[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: IPromotion;
  // ---
  dirty?: Boolean;
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface PromotionsEvent {
  type: "ADD" | "REMOVE" | "CLEAR" | "SET" | "RETRY";
  data?: IPromotion;
  error?: RequestError;
}
