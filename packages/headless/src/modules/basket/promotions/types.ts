// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { IBasketPromotion } from "@upmind-automation/types";
import { QueryResponseError } from "src/modules/query";

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
  error?: QueryResponseError;
}
