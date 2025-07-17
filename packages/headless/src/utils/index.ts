import { isFunction } from "lodash-es";

export * from "./isDeepEmpty";
export * from "./useCookies";
export * from "./useCollections";
export * from "./useError";
export * from "./useFields";
export * from "./useMoney";
export * from "./usePOP";
export * from "./useStorage";
export * from "./useTime";
export * from "./useTranslation";
export * from "./useUrl";
export * from "./useImageUrl";
export * from "./useValidation";
export * from "./useState";

export const DEBOUNCE_DELAY = 350;

export function isPromise(func: any): func is Promise<any> {
  return func && func.constructor && func.constructor.name === "AsyncFunction";
}
