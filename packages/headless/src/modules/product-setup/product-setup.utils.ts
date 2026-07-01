// -----------------------------------------------------------------------------
/**
 * @module productSetup/utils
 * @description Utility functions for determining which products require setup.
 */

import { DeferModes } from "@upmind-automation/types";
import { PRODUCT_SETUP_MODE } from "../config/schema/types";
import { get, isEmpty, some } from "lodash-es";
import type { BasketProduct } from "../basket-product";
import type { IBlueprintField } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/**
 * Determines if a basket product requires setup based on the given mode.
 *
 * @param product - The basket product to check
 * @param mode - The product setup mode (REQUIRED or DEFERRED)
 * @returns True if the product requires setup
 *
 * Logic:
 * - Always returns true if the product has errors
 * - In DEFERRED mode, also returns true if the product has deferred fields with empty values
 */
export function basketProductRequiresSetup(
  product: BasketProduct | undefined,
  mode: (typeof PRODUCT_SETUP_MODE)[keyof typeof PRODUCT_SETUP_MODE] = PRODUCT_SETUP_MODE.REQUIRED
): boolean {
  if (!product) return false;

  // Always include products with errors
  if (!isEmpty(product.errors)) return true;

  // In deferred mode, include products with deferred fields that have empty values
  if (mode === PRODUCT_SETUP_MODE.DEFERRED && product.meta?.deferred) {
    const provisionValues = get(product, "configuration.provisionFields", {});
    return some(
      provisionValues,
      value => value === null || value === undefined || value === ""
    );
  }

  return false;
}

/**
 * Determines if a provision field requires setup based on the given mode.
 *
 * @param field - The provision field definition
 * @param hasError - Whether the field has a validation error
 * @param currentValue - The current value of the field (from baseModel, not live model)
 * @param mode - The product setup mode (REQUIRED or DEFERRED)
 * @returns True if the field requires setup
 *
 * Logic:
 * - Always returns true if the field has an error
 * - In DEFERRED mode, also returns true if the field is deferred and has an empty value
 */
export function fieldRequiresSetup(
  field: IBlueprintField | undefined,
  hasError: boolean,
  currentValue: any,
  mode: (typeof PRODUCT_SETUP_MODE)[keyof typeof PRODUCT_SETUP_MODE] = PRODUCT_SETUP_MODE.REQUIRED
): boolean {
  // Always show fields with errors
  if (hasError) return true;

  // In deferred mode, show deferred fields with empty values
  if (mode === PRODUCT_SETUP_MODE.DEFERRED && field) {
    const isDeferred =
      field.defer_mode === DeferModes.OPTIONAL ||
      field.defer_mode === DeferModes.HIDDEN;
    const isEmptyValue =
      currentValue === null ||
      currentValue === undefined ||
      currentValue === "";

    if (isDeferred && isEmptyValue) return true;
  }

  return false;
}
