// --- global
import { unref, inject, computed } from "vue";

// ---utils
import { merge, get, omit, forEach, keys, split, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

function generateComponentConfig(component, config, globalConfig) {
  config = unref(config) || {}; // safety check
  globalConfig = unref(globalConfig) || {};

  // Check if weve been provided with config overrides, then merge the default config
  const componentConfig = get(globalConfig, component, {});
  const mergedConfig = merge({}, config, componentConfig);
  return mergedConfig;
}

function applyComponentStyles(
  styles: Record<string, Object>,
  context?: { props: Object }
) {
  // ----------------------------------------------
  // safety checks
  const props = context?.props || {};

  // ----------------------------------------------
  // First use the styles WITHOUT the conditional styles
  // these will tend to be child elements withing the component
  const result = omit(styles, "attributes");
  result.root ??= []; // safety, ensure we always have a root array to push to

  // ----------------------------------------------
  // Then apply Conditional styles based on Attributes, if any && if they exist
  // NB: Attributes are the props passed to the component that ALSO have a corresponding style in the config
  const attrs = keys(styles.attributes || {});
  forEach(attrs, attr => {
    const attributStyles = get(styles, ["attributes", attr]);
    const value = get(props, attr);
    const defaults = get(attributStyles, "default", attributStyles);
    if (attributStyles) {
      const style = get(attributStyles, value, defaults);
      result.root.push(...style);
    }
  });

  // ----------------------------------------------
  // Finally return the result with the conditional styles applied
  return result;
}

export const useStyles = (
  component: String,
  config: Record<string, Object>,
  context?: { props: Object }
) => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const globalConfig = inject("upwind", {});

  const styles = computed(() => {
    return applyComponentStyles(
      generateComponentConfig(component, config, globalConfig),
      context
    );
  });

  return styles;
};

// we use a function so that we can have tailwin intellisense and sorting
export const upwConfig = (classes: string) => {
  // TODO: MAYBE parse valid tailwind classes
  // NB: always return as an array without duplicates!
  return uniq(split(classes, " "));
};
