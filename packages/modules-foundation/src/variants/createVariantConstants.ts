import { keys, zipObject, toUpper, map } from "lodash-es";
import type { VariantConstants } from "./types";
// -----------------------------------------------------------------------------

/**
 * Turns the keys of a style variant map into named constants, so that code
 * can write PRODUCT_HERO_DIRECTION.VERTICAL instead of the string "vertical".
 * A variant added to the map gets its constant automatically.
 *
 * @example
 * createVariantConstants({ horizontal: "…", vertical: "…" })
 * // → { HORIZONTAL: "horizontal", VERTICAL: "vertical" }
 */
export function createVariantConstants<T extends Record<string, unknown>>(
  config: T
): VariantConstants<T> {
  const variantKeys = keys(config);
  return zipObject(
    map(variantKeys, toUpper),
    variantKeys
  ) as VariantConstants<T>;
}
