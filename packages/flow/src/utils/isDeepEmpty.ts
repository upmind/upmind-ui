import { isEmpty, isObject, isArray } from "lodash-es";

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

export function compactDeep(value: any): any {
  if (isEmpty(value)) {
    return value;
  }
  if (isObject(value)) {
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      const compactedItem = compactDeep(item);
      if (!isEmpty(compactedItem)) {
        result[key] = compactedItem;
      }
    }
    return result;
  }
  if (isArray(value)) {
    return value.map(item => compactDeep(item)).filter(item => !isEmpty(item));
  }
  return value;
}
