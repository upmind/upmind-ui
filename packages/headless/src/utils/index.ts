import { some } from "lodash-es";

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
export * from "./useTime";
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
