import { sha1 } from "object-hash";
import { omit, startsWith, filter } from "lodash-es";

// --------------------------------------------------------
// utils

export function getMaxAge(seconds = 60) {
  const now = new Date();
  const maxAge = now.setSeconds(now.getSeconds() + seconds);
  return maxAge;
}

export function addMeta(obj: Object, prop: PropertyKey, value: any) {
  Object.defineProperty(obj, prop, {
    value,
    enumerable: false
  });
}

export function generateHash(
  url: URL,
  init: RequestInit,
  queue?: Array<string> // this is to prevent duplicate requests
) {
  const hash = sha1({ ...omit(init, ["signal"]), url: url.toString() });

  const existing = filter(queue, item => startsWith(item, hash));

  if (!existing?.length) return hash;

  return `${hash}-${existing.length}`;
}
