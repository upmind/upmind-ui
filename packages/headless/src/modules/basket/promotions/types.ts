// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { ResponseError } from "../../../utils";
import type { IBasketPromotion } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export interface PromotionModel {
  promocode: string;
}

export interface PromotionsContext {
  basketId?: string;
  // ---
  promotions?: IBasketPromotion[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: PromotionModel;
  // ---
  dirty?: Boolean;
  autoupdate?: Boolean;
  error?: ResponseError;
}
