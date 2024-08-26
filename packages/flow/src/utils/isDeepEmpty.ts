import {
  isEmpty,
  isObject,
  isArray,
  keys,
  isNil,
  filter,
  reduce,
  forEach,
} from "lodash-es";

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

// export function compactDeep(value: any): any {
//   if (isObject(value)) {
//     return reduce(
//       value,
//       (acc, item, key) => {
//         const val = compactDeep(item);
//         if (!isNil(val)) acc[key] = val;
//         return acc;
//       },
//       {}
//     );
//   }

//   if (isArray(value)) {
//     return filter(value, compactDeep);
//   }

//   return value;
// }

export function compactDeep(value) {
  if (isObject(value)) {
    for (const propName in value) {
      if (isObject(value[propName])) {
        compactDeep(value[propName]);
      }
      if (
        isNil(value[propName]) ||
        ((isObject(value[propName]) || isArray(value[propName])) &&
          isEmpty(value[propName]))
      ) {
        delete value[propName];
      }
    }
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (isObject(value[i])) compactDeep(value[i]);

      if (
        isNil(value[i]) ||
        ((isObject(value[i]) || isArray(value[i])) && isEmpty(value[i]))
      ) {
        value.splice(i, 1);
        i--;
      }
    }
  }

  return value;
}
