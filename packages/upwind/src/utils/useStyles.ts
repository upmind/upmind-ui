// --- global
import { unref, inject, computed } from "vue";

// ---utils
import { merge, get, omit, forEach, keys, split, uniq, map } from "lodash-es";

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
  /* Then apply Conditional styles based on Attributes, if any && if they exist
   NB: Attributes are the props passed to the component that ALSO have a corresponding style in the config
      Atrributes consist of a target and options,
      - target is the path of a node WITHIN the styles object to apply the conditional styles to
      eg: root, or button.root, or item.root, etc
      - options are the conditional styles to apply
  */
  const attrs = keys(styles.attributes || {});
  forEach(attrs, attr => {
    const target = get(styles, ["attributes", attr, "target"]);
    const options = get(styles, ["attributes", attr, "options"]);
    const defaults = get(styles, ["attributes", attr, "options", "default"]);
    const value = get(props, attr);
    if (options) {
      const style = get(options, value, defaults);
      const targetStyles = get(result, target, []);
      targetStyles.push(...style);
    }
  });

  // ----------------------------------------------
  // Finally return the result with the conditional styles applied
  return result;
}

export const useStyles = (
  component: string,
  context?: { props: Object },
  ...configs: Array<Record<string, Object>>
) => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const globalConfig = inject("upwind", {});
  const styles = computed(() => {
    return applyComponentStyles(
      generateComponentConfig(component, globalConfig, ...configs),
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
