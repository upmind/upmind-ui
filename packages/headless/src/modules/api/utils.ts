// --- external
import { sha1 } from "object-hash";

// --- utils
import {
  omit,
  startsWith,
  filter,
  isObject,
  camelCase,
  isArray,
  map,
  reduce,
  set,
} from "lodash-es";

// --------------------------------------------------------

export function getMaxAge(seconds = 60) {
  const now = new Date();
  const maxAge = now.setSeconds(now.getSeconds() + seconds);
  return maxAge;
}

export function addMeta(obj: object, prop: PropertyKey, value: any) {
  Object.defineProperty(obj, prop, {
    value,
    enumerable: false,
  });
}

export function generateHash(
  url: URL,
  init: RequestInit,
  useCache?: boolean | null,
  queue?: Array<string> // this is to prevent duplicate requests
) {
  const values: any = omit(init, ["signal"]);
  // handle form data
  if (values.body instanceof FormData) {
    values.body = values.body.toString();
  }
  // add the url to the hash
  values.url = url.toString();

  const hash = sha1(values);

  const existing = filter(queue, item => startsWith(item, hash));

  if (useCache || !existing?.length) return hash;

  return `${hash}-${existing.length}`;
}

export function ensureCamelCaseKeys(response: any): any {
  if (isArray(response)) return map(response, ensureCamelCaseKeys);

  if (!isObject(response)) return response;

  // now we know we definitely have an object
  return reduce(
    response,
    (result, value: any, key) => {
      value = ensureCamelCaseKeys(value);
      set(result, camelCase(key), value);
      return result;
    },
    {}
  );
}

export function parseData(data: any) {
  if (data instanceof FormData) return data;

  if (isObject(data)) return JSON.stringify(data);

  return data;
}
