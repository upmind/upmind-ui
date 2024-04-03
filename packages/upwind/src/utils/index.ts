import { unref } from "vue";
import { merge, get } from "lodash-es";

export function generateComponentStyles(component, defaults, styles) {
  styles = unref(styles) || {}; // safety check

  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const componentStyles = get(styles, component, {});
  debugger;
  const mergedStyles = merge({}, defaults, componentStyles);
  debugger;
  return mergedStyles;
}
