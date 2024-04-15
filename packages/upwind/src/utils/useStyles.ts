// --- global
import { unref, inject, computed, toRaw } from "vue";
import { twMerge } from "tailwind-merge";
import { cx } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

// ---utils
import {
  get,
  isEmpty,
  isFunction,
  isNil,
  map,
  omitBy,
  reduce,
  remove,
  set,
} from "lodash-es";

// -----------------------------------------------------------------------------

function applyVariants(
  configs: Array<Record<string, Function>>,
  context: Object = {}
) {
  // ----------------------------------------------
  //  NB: This works by getting ALL the unique keys from ALL of the provided configs
  //      then we loop over each key
  //      and get each variant for that key from each config
  //      we then run the variant function with the context object
  //      and merge the results into a single object with the CX helper
  //      finally we us the twMerge helper to clean up the final object

  const configKeys = configs.map(Object.keys).flat();

  return reduce(
    configKeys,
    (styles, key) => {
      const variants = map(configs, config => get(config, key, {}));
      const results = map(variants, variant => {
        if (!isFunction(variant)) return variant;
        return variant(context);
      });

      set(styles, key, twMerge(cx(...results)));
      return styles;
    },
    {}
  );
}

export const useStyles = (
  component: string,
  context: Object = {},
  ...configs: Array<Record<string, Object>>
) => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const globalConfig = inject("upwind", {});

  const styles = computed(() => {
    // add any component specific overrides from our injected global config
    const componentConfig = get(toRaw(unref(globalConfig)), component);
    configs.push(componentConfig);

    // safety checks
    const cleanContext = omitBy(unref(context), isNil);
    const cleanConfigs = configs.map(unref);
    remove(cleanConfigs, isEmpty);

    // return the merged configs using the provided helper
    return applyVariants(cleanConfigs, cleanContext);
  });

  return styles;
};
