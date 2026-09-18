import type { ResponseError } from "../../utils";
import type { PromotionDetails } from "../product";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export type PromotionModel = {
  promocode: string;
};

export type PromotionsContext = {
  basketId?: string;
  // ---
  promotions?: PromotionDetails[];
  schema?: JsonSchema;
  uischema?: UISchemaElement;
  model?: PromotionModel;
  baseModel?: PromotionModel;
  // ---
  autoupdate?: boolean;
  error?: ResponseError;
};
