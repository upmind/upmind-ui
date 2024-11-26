// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../..//api/types";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

export interface IPromotion {
  promocode: string;
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
  autoupdate?: Boolean;
  error?: any;
}

// --------------------------------------------------------
// Events

export interface PromotionsEvent {
  type: "ADD" | "REMOVE" | "CLEAR" | "SET" | "RETRY";
  data?: IPromotion;
  // TODO:
  // error?: RequestError;
  error?: any;
}
