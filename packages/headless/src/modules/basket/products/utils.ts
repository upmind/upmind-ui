// --- external

// --- internal

// --- utils

import { mapValues, reduce, values, map, isObject } from "lodash-es";

// --- types
import type { BasketProductConfig } from "../types";
import type { ProductModel } from "../../product/types";
import type { IBasketPromotion } from "@upmind-automation/types";
// ------------------§-----------------------------------------------------------------

export function parseBasketProductConfig(
  model: ProductModel,
  promotions?: BasketProductConfig["promotions"]
): BasketProductConfig {
  return {
    product_id: model?.productId,
    quantity: model?.quantity,
    billing_cycle_months: model?.term,
    // ---
    attributes: reduce(
      model?.attributes,
      (result: any[], attribute) => {
        if (attribute) {
          const selected = values(
            mapValues(attribute, choice => ({
              product_id: choice?.productId,
              quantity: choice?.quantity,
              billing_cycle_months: choice?.cycle,
            }))
          );
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    // ---
    options: reduce(
      model?.options,
      (result: any[], option) => {
        if (option) {
          const selected = values(
            mapValues(option, choice => ({
              product_id: choice?.productId,
              unit_quantity: choice?.quantity,
              billing_cycle_months: choice?.cycle,
            }))
          );
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    // ---
    provision_field_values: model.provisionFields || [],
    // ---
    promotions: map(promotions, (promotion: IBasketPromotion) => {
      return isObject(promotion)
        ? { promocode: promotion.promotion.code }
        : { promocode: promotion };
    }),
  } as BasketProductConfig;
}
