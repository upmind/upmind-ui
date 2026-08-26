import { keys, zipObject, upperCase, map } from "lodash-es";

type ParsedVariants<T> = {
  [K in keyof T as Uppercase<string & K>]: K & string;
};

/**
 * Creates a variant constants object from a config object.
 *
 * @example
 * parseVariants({ success: {}, danger: {} }) // { SUCCESS: "success", DANGER: "danger" }
 */
export function parseVariants<T extends Record<string, unknown>>(
  config: T
): ParsedVariants<T> {
  const variantKeys = keys(config);
  return zipObject(
    map(variantKeys, upperCase),
    variantKeys
  ) as ParsedVariants<T>;
}

// Type helper to extract variant values
export type VariantValues<T> = T[keyof T];
