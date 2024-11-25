// --- external

// --- internal

// --- utils

import { mapValues, reduce, values } from "lodash-es";

// --- types
import type { BasketProductConfig } from "../types";
import type { ProductModel } from "../../product/types";
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
      (result, attribute) => {
        if (attribute) {
          const selected = values(
            mapValues(attribute, choice => ({
              product_id: choice?.productId,
              quantity: choice?.quantity,
              billing_cycle_months: choice?.cycle,
            }))
          );
          // @ts-ignore
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    // ---
    options: reduce(
      model?.options,
      (result, option) => {
        if (option) {
          const selected = values(
            mapValues(option, choice => ({
              product_id: choice?.productId,
              unit_quantity: choice?.quantity,
              billing_cycle_months: choice?.cycle,
            }))
          );
          // @ts-ignore
          result.push(...selected);
        }
        return result;
      },
      []
    ),
    // ---
    provision_field_values: model.provisionFields || [],
    // ---
    promotions: promotions || [],
  } as BasketProductConfig;
}
