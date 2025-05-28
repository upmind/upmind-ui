// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { IBasketPromotion } from "@upmind-automation/types";
import { ResponseError } from "src/modules/query";

// -----------------------------------------------------------------------------

export interface Promotion {
  promocode: string;
}

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
  error?: ResponseError;
}
