import {
  isEmpty,
  isObject,
  isArray,
  isNil,
  reduce,
  isObjectLike,
  compact,
} from "lodash-es";

// -----------------------------------------------------------------------------

// a custom isEmpty that can handle deeply nested objects
export function isDeepEmpty(value: any): boolean {
  if (isEmpty(value)) {
    return true;
  }
  if (isObject(value)) {
    for (const item of Object.values(value)) {
      // if item is not undefined and is a primitive, return false
      // otherwise dig deeper
      if (
        (item !== undefined && typeof item !== "object") ||
        !isDeepEmpty(item)
      ) {
        return false;
      }
    }
    return true;
  }
  if (isArray(value)) {
    return value.every(item => isDeepEmpty(item));
  }
  return isEmpty(value);
}

export function compactDeep(value?: any): any {
  let cleaned = undefined;

  if (isObject(value)) {
    cleaned = reduce(
      value,
      (acc: Record<string, any>, val, key: string) => {
        const cleanedValue = compactDeep(val);
        if (!isNil(cleanedValue)) {
          // Check if the object itself is empty, even if it has properties
          if (!isEmpty(cleanedValue) || !isObjectLike(cleanedValue)) {
            acc[key] = cleanedValue;
          }
        }
        return acc;
      },
      {}
    );
  } else if (isArray(value)) {
    cleaned = compact(value.map(compactDeep));
  } else {
    cleaned = value;
  }

  // console.debug("compactDeep", value, "cleaned", cleaned);
  return cleaned;
}
