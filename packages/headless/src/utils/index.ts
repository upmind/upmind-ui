import { some } from "lodash-es";

// useTime FIRST — it is a dependency-free leaf, while util members below
// (useError, useCalculate) import the app `modules` graph that cycles back
// through query → basket. Exporting useTime before them initialises its binding
// before any eager module-load caller (basket debounce configs) reads it —
// otherwise the barrel is re-entered mid-eval and `useTime` is not yet defined
// (`useTime is not a function` at import time).
export * from "./useTime";
export * from "./isDeepEmpty";
export * from "./useCookies";
export * from "./useCollections";
export * from "./useError";
export * from "./useFields";
export * from "./useMoney";
export * from "./useCalculate";
export * from "./useCalculate.types";
export * from "./usePOP";
export * from "./useStorage";
export * from "./useDate";
export * from "./useError";
export * from "./useTranslation";
export * from "./useUrl";
export * from "./useImageUrl";
export * from "./useValidation";
export * from "./useState";
export * from "./useScripts";
export * from "./parseFlattened";
export * from "./validateTemplate";

export const DEBOUNCE_DELAY = 350;
export const ANIMATION_DELAY = 500;

export function isPromise(func: any): func is Promise<any> {
  return func && func.constructor && func.constructor.name === "AsyncFunction";
}

/**
 * Generic type guard that checks if a value matches a model shape
 * by verifying at least one of the specified keys exists on the object.
 */
export function isModelShape<T>(data: unknown, keys: (keyof T)[]): data is T {
  return (
    !!data &&
    typeof data === "object" &&
    some(keys, key => key in (data as object))
  );
}
