import {
  isEmpty,
  isObject,
  isArray,
  isNil,
  isString,
  reduce,
  isObjectLike,
  compact,
  isEqual
} from "lodash-es";
import { toRaw, unref } from "vue";

// -----------------------------------------------------------------------------

// a custom isEmpty that can handle deeply nested objects
export function isDeepEmpty(
  value: any,
  seen: WeakSet<object> = new WeakSet()
): boolean {
  // Unwrap Vue reactive/computed values to get the raw underlying object
  let rawValue = unref(value);
  if (isObjectLike(rawValue)) {
    rawValue = toRaw(rawValue);
  }

  if (isEmpty(rawValue)) {
    return true;
  }

  // Handle circular references - if we've seen this object, treat as empty to break the cycle
  if (isObjectLike(rawValue)) {
    if (seen.has(rawValue)) {
      return true;
    }
    seen.add(rawValue);
  }

  if (isObject(rawValue)) {
    for (const item of Object.values(rawValue)) {
      // if item is not undefined and is a primitive, return false
      // otherwise dig deeper
      if (
        (item !== undefined && typeof item !== "object") ||
        !isDeepEmpty(item, seen)
      ) {
        return false;
      }
    }
    return true;
  }
  if (isArray(rawValue)) {
    return rawValue.every(item => isDeepEmpty(item, seen));
  }
  return isEmpty(rawValue);
}

export function compactDeep(
  value?: any,
  seen: WeakSet<object> = new WeakSet(),
  path: string = "root"
): any {
  // Unwrap Vue reactive/computed values to get the raw underlying object
  let rawValue = unref(value);
  if (isObjectLike(rawValue)) {
    rawValue = toRaw(rawValue);
  }

  let cleaned = undefined;

  // Handle circular references - if we've seen this object, return undefined to break the cycle
  if (isObjectLike(rawValue)) {
    if (seen.has(rawValue)) {
      console.trace(
        `[compactDeep] Circular reference detected at path: ${path}`,
        { keys: Object.keys(rawValue).slice(0, 10) }
      );
      return undefined;
    }
    seen.add(rawValue);
  }

  if (isObject(rawValue)) {
    cleaned = reduce(
      rawValue,
      (acc: Record<string, any>, val, key: string) => {
        const cleanedValue = compactDeep(val, seen, `${path}.${key}`);
        if (
          !isNil(cleanedValue) &&
          !(isString(cleanedValue) && isEmpty(cleanedValue))
        ) {
          // Check if the object itself is empty, even if it has properties
          if (!isEmpty(cleanedValue) || !isObjectLike(cleanedValue)) {
            acc[key] = cleanedValue;
          }
        }
        return acc;
      },
      {}
    );
  } else if (isArray(rawValue)) {
    cleaned = compact(
      rawValue.map((item, index) =>
        compactDeep(item, seen, `${path}[${index}]`)
      )
    );
  } else {
    cleaned = isString(rawValue) && isEmpty(rawValue) ? undefined : rawValue;
  }

  // console.debug("compactDeep", value, "cleaned", cleaned);
  return cleaned;
}

export function isDirty(baseModel: any, model: any): boolean {
  return !isEqual(compactDeep(baseModel), compactDeep(model));
}
