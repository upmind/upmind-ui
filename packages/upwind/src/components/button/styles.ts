// --- global
import { inject, ref, watch } from "vue";

// --- internal

import config from "./config";

// --- utils
import { generateComponentConfig } from "../../utils";
import { get, omit } from "lodash-es";

// --- types

export const enum ButtonSize {
  xs = "extra-small",
  sm = "small",
  md = "medium",
  lg = "large",
  xl = "extra-large",
}

export const enum ButtonVariant {
  elevated = "elevated",
  flat = "flat",
  outlined = "outlined",
  ghost = "ghost",
  plain = "plain",
  link = "link",
}

export const enum ButtonColor {
  primary = "primary",
  secondary = "secondary",
  accent = "accent",
  neutral = "neutral",
  // ---
  success = "success",
  error = "error",
  warning = "warning",
  info = "info",
  // ---
}

export const enum ButtonShape {
  none = "none",
  sm = "sm",
  md = "md",
  lg = "lg",
  xl = "xl",
  pill = "pill",
  icon = "icon",
}

// ----------------------------------------------

function applyStyles(styles, { props }) {
  const result = omit(styles, "sizes", "variants", "colors", "shapes");
  // ----------------------------------------------
  // Conditional styles

  // -- Sizes
  const sizes = get(styles, "sizes");
  const size = get(sizes, props.size, sizes.default);
  result.root.push(...size);

  // --- Variants
  const variants = get(styles, "variants");
  const variant = get(variants, props.variant, variants.default);
  result.root.push(...variant);

  // --- Color Variants
  const colors = get(styles, "colors");
  if (props.disabled) {
    result.root.push(...colors.disabled);
  } else {
    const colors = get(styles, "colors");
    const color = get(colors, props.color, colors.default);
    result.root.push(...color);
  }

  // --- Shape Variants
  const shapes = get(styles, "shapes");
  const shape = get(shapes, props.shape, shapes.default);
  result.root.push(...shape);

  // ----------------------------------------------

  return result;
}

// ----------------------------------------------

export default context => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const globalConfig = inject("upwind", {});

  const styles = ref();
  styles.value = applyStyles(
    generateComponentConfig("button", config, globalConfig),
    context
  );

  // Watch for changes in the override styles
  watch(globalConfig, () => {
    styles.value = applyStyles(
      generateComponentConfig("button", config, globalConfig),
      context
    );
  });

  return styles;
};
