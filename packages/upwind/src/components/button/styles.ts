import { inject, ref } from "vue";
import { merge, get, omit } from "lodash-es";

export const enum ButtonSize {
  xs = "extra-small",
  sm = "small",
  md = "medium",
  lg = "large",
  xl = "extra-large",
}

export const enum ButtonVariant {
  elevated = "elevated",
  plain = "plain",
  flat = "flat",
  outlined = "outlined",
  ghost = "ghost",
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
  full = "full",
}
// ----------------------------------------------
// our form component styles

const defaultStyles = {
  root: [
    "align-bottom",
    "gap-2",
    "inline-flex",
    "items-center",
    "justify-center",
    "leading-normal",
    "text-center",
    "transition-all",
  ],
  label: ["duration-200", "font-bold", "flex-1"],
  icon: ["size-4"],
  loading: ["size-4", "animate-spin"],
  // badge: ["size-4", "leading-none", "flex", "items-center", "justify-center"],
  // ---
  sizes: {
    default: ["py-3", "px-4"],
    xs: ["py-1", "px-2", "text-xs"],
    sm: ["py-2", "px-3", "text-sm"],
    md: ["py-3", "px-4"],
    lg: ["py-4", "px-5", "text-lg"],
    xl: ["py-5", "px-6", "text-xl"],
  },
  variants: {
    default: "",
    elevated: ["shadow-md", "hover:shadow-lg"],
    plain: "",
    flat: "",
    outlined: "border",
    ghost: "",
    link: "hover:underline",
    icon: [
      "!p-0",
      "[&[data-size=xs]]size-2",
      "[&[data-size=sm]]size-3",
      "[&[data-size=md]]size-4",
      "[&[data-size=lg]]size-5",
      "[&[data-size=xl]]size-6",
      "[&>.label]:sr-only",
    ],
  },
  colors: {
    default: [
      "bg-neutral",
      "text-neutral-content",
      "hover:bg-neutral-600",
      "border-neutral-300",
      "hover:border-neutral-100",
    ],
    disabled: [
      "bg-neutral-300",
      "text-neutral-content",
      "border-neutral-300",
      "cursor-not-allowed",
      "hover:bg-neutral-300",
    ],
    primary: [
      "bg-primary",
      "text-primary-content",
      "hover:bg-primary-600",
      "border-primary-300",
      "hover:border-primary-100",
    ],
    secondary: [
      "bg-secondary",
      "text-secondary-content",
      "hover:bg-secondary-600",
      "border-secondary-300",
      "hover:border-secondary-100",
    ],
    accent: [
      "bg-accent",
      "text-accent-content",
      "hover:bg-accent-600",
      "border-accent-300",
      "hover:border-accent-100",
    ],
    neutral: [
      "bg-neutral",
      "text-neutral-content",
      "hover:bg-neutral-600",
      "border-neutral-300",
      "hover:border-neutral-100",
    ],
    success: [
      "bg-success",
      "text-success-content",
      "hover:bg-success-600",
      "border-success-300",
      "hover:border-success-100",
    ],
    error: [
      "bg-error",
      "text-error-content",
      "hover:bg-error-600",
      "border-error-300",
      "hover:border-error-100",
    ],
    warning: [
      "bg-warning",
      "text-warning-content",
      "hover:bg-warning-600",
      "border-warning-300",
      "hover:border-warning-100",
    ],
    info: [
      "bg-info",
      "text-info-content",
      "hover:bg-info-600",
      "border-info-300",
      "hover:border-info-100",
    ],
  },
  shapes: {
    default: ["rounded-sm"],
    none: ["rounded-none"],
    xs: ["rounded-xs"],
    sm: ["rounded-sm"],
    md: ["rounded-md"],
    lg: ["rounded-lg"],
    xl: ["rounded-xl"],
    pill: ["rounded-full"],
  },
};

// ----------------------------------------------

export default ({ props }) => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const overrideStyles = get(inject("styles", {}), "button", {});
  const mergedStyles = merge({}, defaultStyles, overrideStyles);

  // -- Remove the variants, sizes, colors and rounded from the root styles as they will be applied conditionally
  const styles = ref();
  styles.value = omit(mergedStyles, "sizes", "variants", "colors", "shapes");

  // ----------------------------------------------
  // Conditional styles

  // -- Sizes
  const sizes = get(mergedStyles, "sizes");
  const size = get(sizes, props.size, sizes.default);
  styles.value.root.push(...size);

  // --- Variants
  const variants = get(mergedStyles, "variants");
  const variant = get(variants, props.variant, variants.default);
  styles.value.root.push(...variant);

  // --- Color Variants
  const colors = get(mergedStyles, "colors");
  if (props.disabled) {
    styles.value.root.push(...colors.disabled);
  } else {
    const colors = get(mergedStyles, "colors");
    const color = get(colors, props.color, colors.default);
    styles.value.root.push(...color);
  }

  // --- Shape Variants
  const shapes = get(mergedStyles, "shapes");
  const shape = get(shapes, props.shape, shapes.default);
  styles.value.root.push(...shape);

  // ----------------------------------------------
  debugger;
  return styles;
};
