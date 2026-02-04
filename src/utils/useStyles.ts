// --- external
import { clsx } from "clsx";
import { unref, toRaw, computed } from "vue";
import defaultStylesheet from "../main.css?url";
import { twMerge } from "./twMerge";
import theme from "./useThemes";
// --- utils
import {
  flattenDeep,
  forEach,
  get,
  isArray,
  isEmpty,
  isFunction,
  isNil,
  isObject,
  map,
  mapValues,
  omitBy,
  reduce,
  set,
  keys
} from "lodash-es";
// --- types
import type { ClassValue } from "clsx";
import type { ClassNameValue } from "tailwind-merge";
import type { ComputedRef } from "vue";

/**
 * Recursively resolves the types of a style configuration object.
 *
 * - If a property is a function (e.g., from `cva`), it maps to `string`.
 * - If a property is an object, it recurses to resolve its properties.
 * - Otherwise, it preserves the original type.
 *
 * This ensures that the final `styles` object returned by `useStyles`
 * has accurate types reflecting the computed class names.
 */
export type ResolveVariants<T> = {
  [K in keyof T]: T[K] extends Function
    ? string
    : T[K] extends object
      ? ResolveVariants<T[K]>
      : T[K];
};

let customStyleSheet: string = "";
// -----------------------------------------------------------------------------

function applyVariants(configs: ClassValue[], context: object = {}) {
  // ----------------------------------------------
  //  NB: This works by getting ALL the unique keys from ALL of the provided configs
  //      then we loop over each key
  //      and get each variant for that key from each config
  //      we then run the variant function with the context object
  //      and merge the results into a single object with the CX helper
  //      finally we us the twMerge helper to clean up the final object

  const configKeys = configs.map(keys).flat();

  if (isEmpty(configKeys)) {
    return twMerge(
      clsx(
        ...map(configs, config =>
          isFunction(config) ? config(context) : config
        )
      )
    );
  }

  return reduce(
    configKeys,
    (styles, key) => {
      const variants = map(configs, config => get(config, key, {}));
      const results = map(variants, variant =>
        isFunction(variant) ? variant(context) : variant
      );
      set(styles, key, twMerge(clsx(results)));
      return styles;
    },
    {}
  );
}

export function useStyles<T extends object = object>(
  components: string | string[],
  context: object = {},
  ...configs: (T | Record<string, any>)[]
): ComputedRef<ResolveVariants<T>> {
  return computed(() => {
    // ensure component is an array so we can loop over it and handle multiple components
    components = isArray(components) ? components : [components];
    configs = flattenDeep(configs); // in case were passed nested arrays

    // Add any provided config overrides
    const globalConfig = theme?.config.value;

    if (!isEmpty(globalConfig)) {
      configs.push(globalConfig as T);
    }

    // deep clean the context object to remove any refs and falsy values
    const cleanContext = omitBy(
      mapValues(unref(context), prop => unref(prop)),
      isNil
    );

    // pick out our component specific configs only and add them to the styles object
    const styles = {};
    forEach(components, component => {
      const componentConfigs = reduce(
        configs,
        (result, config) => {
          config = toRaw(unref(config));

          const componentConfig = get(config, component);
          if (
            isFunction(componentConfig) ||
            (isObject(componentConfig) && !isEmpty(componentConfig))
          ) {
            result.push(componentConfig);
          }
          return result;
        },
        [] as Array<Object>
      );

      set(styles, component, applyVariants(componentConfigs, cleanContext));
    });

    // return the requested styles with the variants applied
    return styles as ResolveVariants<T>;
  });
}

export function cn(...styles: ClassNameValue[]) {
  return twMerge(clsx(styles));
}

export const stylesheet = computed((): string => {
  const isDev = import.meta.env.DEV;
  return isDev || isEmpty(customStyleSheet)
    ? defaultStylesheet
    : customStyleSheet;
});

export function useStyleSheet(url: string) {
  customStyleSheet = url;
}

export function getComputedColor(className: string): string {
  const app = document.getElementById("vue-app");
  const cssVar = getComputedStyle(app || document.documentElement)
    .getPropertyValue(`--${className}`)
    .trim();

  if (cssVar) {
    return cssVar;
  }

  const tempElement = document.createElement("div");
  tempElement.className = "text-" + className;
  (app || document.body).appendChild(tempElement);

  const computedStyle = window.getComputedStyle(tempElement);
  const color = computedStyle.color;

  (app || document.body).removeChild(tempElement);

  const rgb = color.match(/\d+/g);
  if (rgb) {
    return `#${parseInt(rgb[0]).toString(16).padStart(2, "0")}${parseInt(rgb[1]).toString(16).padStart(2, "0")}${parseInt(rgb[2]).toString(16).padStart(2, "0")}`;
  }

  return "#121217";
}
