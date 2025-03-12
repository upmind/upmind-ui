// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
// import type { RequestError } from "../..//api/types";
import type { IBasketPromotion } from "@upmind-automation/types";
// ---  ENUMS

// ---  private

export interface Promotion {
  promocode: string;
}

// ---  Contexts

export interface PromotionsContext {
  basketId?: string;
  // ---
  promotions?: IBasketPromotion[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: Promotion;
  // ---
  dirty?: Boolean;
  autoupdate?: Boolean;
  error?: any;
}
