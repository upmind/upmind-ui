// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { ResponseError } from "../../../utils";
import type { PromotionDetails } from "@/modules/product";

// -----------------------------------------------------------------------------

export interface PromotionModel {
  promocode: string;
}

export interface PromotionsContext {
  basketId?: string;
  // ---
  promotions?: PromotionDetails[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: PromotionModel;
  baseModel?: PromotionModel;
  // ---
  autoupdate?: Boolean;
  error?: ResponseError;
}
