import { isEmpty, isObject, isArray } from "lodash-es";

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
