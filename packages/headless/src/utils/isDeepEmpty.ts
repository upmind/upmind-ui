import {
  isEmpty,
  isArray,
  isBoolean,
  isNil,
  isNumber,
  isString,
  map,
  reduce,
  reject,
  isObjectLike,
  isEqual,
  size
} from "lodash-es";
import { toRaw, unref } from "vue";

// -----------------------------------------------------------------------------

/**
 * A value carries real data if it is:
 * - any non-empty string
 * - any number (including 0)
 * - any boolean (including false)
 */
function isMeaningful(value: unknown): boolean {
  if (isNil(value)) return false;
  if (isString(value)) return !isEmpty(value);
  if (isNumber(value)) return true;
  if (isBoolean(value)) return true;
  return true;
}

/**
 * Recursively strips all non-meaningful values from a structure.
 * Strips: null, undefined, empty strings, empty objects, empty arrays.
 * Keeps: non-empty strings, all numbers (including 0), all booleans (including false).
 * Returns undefined if the entire value is empty.
 */
export function compactDeep(value?: any): any {
  const raw = toRaw(unref(value));

  // --- primitives
  if (!isObjectLike(raw)) {
    return isMeaningful(raw) ? raw : undefined;
  }

  // --- arrays
  if (isArray(raw)) {
    const cleaned = reject(map(raw, compactDeep), isNil);
    return size(cleaned) ? cleaned : undefined;
  }

  // --- objects
  const cleaned = reduce(
    raw,
    (acc: Record<string, any>, val, key: string) => {
      const stripped = compactDeep(val);
      if (!isNil(stripped)) acc[key] = stripped;
      return acc;
    },
    {}
  );

  return size(cleaned) ? cleaned : undefined;
}

/**
 * Checks if a value is deeply empty (no meaningful data).
 * Uses compactDeep to strip all non-meaningful values and checks if nothing remains.
 */
export function isDeepEmpty(value: any): boolean {
  return isNil(compactDeep(value));
}

// -----------------------------------------------------------------------------

export function isDirty(baseModel: any, model: any): boolean {
  return !isEqual(compactDeep(baseModel), compactDeep(model));
}
