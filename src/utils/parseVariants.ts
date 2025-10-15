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

export function parseVariants<T extends Record<string, any>>(
  config: T
): Record<string, string> {
  const variantKeys = keys(config);
  return zipObject(variantKeys.map(upperCase), variantKeys) as Record<
    string,
    string
  >;
}
