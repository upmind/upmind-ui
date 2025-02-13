// --- external
import { unref, toRaw, computed } from "vue";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";
import theme from "./useThemes";

// @ts-ignore
import defaultStylesheet from "../assets/main.css?url";

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
  keys,
} from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import { type ClassValue } from "clsx";
import { type ClassNameValue } from "tailwind-merge";

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

export function useStyles(
  components: string | string[],
  context: object = {},
  ...configs: Array<Object>
): ComputedRef<Object> {
  return computed(() => {
    // ensure component is an array so we can loop over it and handle multiple components
    components = isArray(components) ? components : [components];
    configs = flattenDeep(configs); // in case were passed nested arrays
    // Add any provided config overrides
    const globalConfig = unref(theme?.config);
    if (!isEmpty(globalConfig)) configs.push(globalConfig);

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
    return styles;
  });
}

export function cn(...styles: ClassNameValue[]) {
  return twMerge(clsx(styles));
}

export const stylesheet = computed((): string => {
  // @ts-ignore
  const isDev = import.meta.env.DEV;
  return isDev || isEmpty(customStyleSheet)
    ? defaultStylesheet
    : customStyleSheet;
});

export function useStyleSheet(url: string) {
  customStyleSheet = url;
}
