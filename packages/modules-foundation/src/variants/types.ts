/**
 * @module foundation/variants/types
 */

/** The union of a constants object's values, for example "horizontal" | "vertical". */
export type VariantValue<T> = T[keyof T];

export type VariantConstants<T> = {
  [K in keyof T as Uppercase<string & K>]: K & string;
};
