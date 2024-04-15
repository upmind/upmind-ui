// --- global
import { unref, inject, computed, toRaw } from "vue";
import { twMerge } from "tailwind-merge";
import { cx } from "class-variance-authority";
// import type { VariantProps } from "class-variance-authority";

// ---utils
import {
  forEach,
  get,
  isArray,
  isEmpty,
  isFunction,
  isNil,
  isObject,
  map,
  omitBy,
  reduce,
  set,
} from "lodash-es";

// -----------------------------------------------------------------------------

function applyVariants(configs: Array<Object>, context: Object = {}) {
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
      const results = map(variants, variant =>
        isFunction(variant) ? variant(context) : variant
      );
      set(styles, key, twMerge(cx(...results)));
      return styles;
    },
    {}
  );
}

export const useStyles = (
  components: string | string[],
  context: Object = {},
  ...configs: Array<Object>
) => {
  // ensure component is an array so we can loop over it and handle multiple components
  components = isArray(components) ? components : [components];

  // Add any provided style overrides to our config, aka globalConfig
  const globalConfig = inject("upwind", {});
  if (!isEmpty(globalConfig)) configs.push(globalConfig);

  return computed(() => {
    const styles = {};

    // clean up the context object to remove any refs
    const cleanContext = omitBy(toRaw(unref(context)), isNil);
    // pick out our component specific configs only
    forEach(components, component => {
      const componentConfigs = reduce(
        configs,
        (result, config) => {
          config = toRaw(unref(config));
          const componentConfig = get(config, component);

          if (isObject(componentConfig) && !isEmpty(componentConfig)) {
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
};
