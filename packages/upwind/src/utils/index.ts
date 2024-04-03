import { unref } from "vue";
import { merge, get } from "lodash-es";

export function generateComponentConfig(component, config, globalConfig) {
  config = unref(config) || {}; // safety check
  globalConfig = unref(globalConfig) || {};

  // Check if weve been provided with config overrides, then merge the default config
  const componentConfig = get(globalConfig, component, {});
  const mergedConfig = merge({}, config, componentConfig);
  return mergedConfig;
}
