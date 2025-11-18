// --- external
import { keys, zipObject, upperCase } from "lodash-es";

/**
 * Creates a variant constants object from a config object
 * @param config - Object with variant keys
 * @returns Object with uppercase keys mapped to original lowercase values
 *
 * @example
 * const config = { success: {}, danger: {}, info: {} };
 * const variants = createVariants(config);
 * // Result: { SUCCESS: "success", DANGER: "danger", INFO: "info" }
 *
 * NOTE: Loadash was causing issues with the types
 */

type ParsedVariants<T> = {
  [K in keyof T as Uppercase<string & K>]: K & string;
};

export function parseVariants<T extends Record<string, any>>(
  config: T
): ParsedVariants<T> {
  const variantKeys = keys(config);
  return zipObject(
    variantKeys.map(upperCase),
    variantKeys
  ) as ParsedVariants<T>;
}

// Type helper to extract variant values
export type VariantValues<T> = T[keyof T];
