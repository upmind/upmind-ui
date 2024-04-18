// --- global
import { unref, inject, ref, toRaw, computed } from "vue";
import { twMerge } from "tailwind-merge";
import { cx } from "class-variance-authority";
// import type { VariantProps } from "class-variance-authority";

// ---utils
import {
  forEach,
  get,
  mapValues,
  isArray,
  isEmpty,
  isFunction,
  isNil,
  isObject,
  map,
  omitBy,
  reduce,
  set,
  flattenDeep,
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

export function useStyles(
  components: string | string[],
  context: Object = {},
  ...configs: Array<Object>
) {
  return computed(() => {
    // ensure component is an array so we can loop over it and handle multiple components
    components = isArray(components) ? components : [components];
    configs = flattenDeep(configs); // in case were passed nested arrays

    // Add any provided style overrides to our config, aka globalConfig
    const globalConfig = inject("upwind", {});
    if (!isEmpty(globalConfig)) configs.push(globalConfig);

    const styles = {};

    // deep clean the context object to remove any refs and falsy values
    const cleanContext = omitBy(
      mapValues(unref(context), prop => unref(prop)),
      isNil
    );

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
}
