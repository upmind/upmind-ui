import { unref, inject, ref, watch, computed } from "vue";
import { merge, get, omit, forEach } from "lodash-es";

function generateComponentConfig(component, config, globalConfig) {
  config = unref(config) || {}; // safety check
  globalConfig = unref(globalConfig) || {};

  // Check if weve been provided with config overrides, then merge the default config
  const componentConfig = get(globalConfig, component, {});
  const mergedConfig = merge({}, config, componentConfig);
  return mergedConfig;
}

function applyComponentStyles(
  attrs: String[],
  styles: Record<string, Object>,
  { props }: { props: Object }
) {
  // ----------------------------------------------
  // First use the styles WITHOUT the conditional styles
  // these will tend to be child elements withing the component
  const result = omit(styles, ...attrs);
  result.root ??= []; // safety, ensure we always have a root array to push to

  // ----------------------------------------------
  // Then apply Conditional styles based on Attributes
  // NB: Attributes are the props passed to the component that ALSO have a corresponding style in the config

  forEach(attrs, attr => {
    const attributStyles = get(styles, attr);
    const value = get(props, attr);
    const defaults = get(attributStyles, "default", attributStyles);
    if (attributStyles) {
      const style = get(attributStyles, value, defaults);
      result.root.push(...style);
    }
  });

  // ----------------------------------------------
  // Finally return the result with the conditional styles applied
  debugger;
  return result;
}

export const useStyles = (
  attrs: String[],
  config: Record<string, Object>,
  context: { props: Object }
) => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const globalConfig = inject("upwind", {});

  const styles = computed(() => {
    return applyComponentStyles(
      attrs,
      generateComponentConfig("button", config, globalConfig),
      context
    );
  });

  // const styles = ref();
  // styles.value = applyComponentStyles(
  //   [],
  //   generateComponentConfig("button", config, globalConfig),
  //   context
  // );

  // // Watch for changes in the override styles
  // watch(globalConfig, () => {
  //   styles.value = applyComponentStyles(
  //     attrs,
  //     generateComponentConfig("button", config, globalConfig),
  //     context
  //   );
  // });

  return styles;
};
