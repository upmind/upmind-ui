// --- external
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --- internal
import type { ResponseError } from "../../../utils";
import type { PromotionDetails } from "../../product";

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
  /** The codes on the basket, refreshed from every basket REFRESH */
  baseModel?: PromotionModel[];
  /** Every earlier `baseModel`, newest last, so a swap can go back */
  history?: PromotionModel[][];
  // ---
  autoupdate?: Boolean;
  error?: ResponseError;
}
