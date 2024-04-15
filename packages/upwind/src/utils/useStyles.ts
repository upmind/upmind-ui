// --- global
import { unref, inject, computed } from "vue";
import { twMerge } from "tailwind-merge";
import type { VariantProps } from "class-variance-authority";

// ---utils
import {
  merge,
  get,
  map,
  mapValues,
  isFunction,
  omitBy,
  isNil,
} from "lodash-es";

// -----------------------------------------------------------------------------

function generateComponentConfig(
  component: string,
  globalConfig: Record<string, Object>,
  ...configs: Array<Record<string, Object>>
) {
  configs = map(configs, unref); // safety check
  globalConfig = unref(globalConfig) || {};

  // Check if weve been provided with config overrides, then merge the default config
  // TODO: maybe add some intelligent merging here, to ensure we dont add contradictory styles, eg 2 bg-[colors]
  const componentConfig = get(globalConfig, component, {});
  const mergedConfig = merge({}, ...configs, componentConfig);
  return mergedConfig;
}

function applyComponentStyles(
  component: string,
  styles: Record<string, Function>,
  context: Object = {}
) {
  // ----------------------------------------------
  context = omitBy(unref(context), isNil);

  return mapValues(styles, (variant, key) => {
    if (!isFunction(variant)) return variant;

    console.log("applyComponentStyles", component, {
      key,
      context,
      variant: twMerge(variant(context)),
    });

    return twMerge(variant(context));
  });
}

export const useStyles = (
  component: string,
  context: Object = {},
  ...configs: Array<Record<string, Object>>
) => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const globalConfig = inject("upwind", {});
  const styles = computed(() => {
    return applyComponentStyles(
      component,
      generateComponentConfig(component, globalConfig, ...configs),
      context
    );
  });

  return styles;
};
