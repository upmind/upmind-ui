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
