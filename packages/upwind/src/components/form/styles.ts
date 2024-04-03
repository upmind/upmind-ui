import { inject } from "vue";
import { merge, get, pick, omit } from "lodash-es";

const enum ButtonSize {
  xs = "extra-small",
  sm = "small",
  md = "medium",
  lg = "large",
  xl = "extra-large",
}

const enum ButtonVariant {
  elevated = "elevated",
  plain = "plain",
  flat = "flat",
  outlined = "outlined",
  ghost = "ghost",
  link = "link",
}

const enum ButtonColor {
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
// ----------------------------------------------
// our form component styles

const defaultStyles = {
  root: [
    "inline-flex",
    "items-center",
    "text-center",
    "align-bottom",
    "justify-center",
    "gap-2",
    "leading-normal",
  ],
  label: ["duration-200", "font-bold", "flex-1"],
  icon: ["size-4"],
  loading: ["size-4", "animate-spin"],
  badge: ["size-4", "leading-none", "flex", "items-center", "justify-center"],
  // ---
  sizes: {
    default: "py-3 px-4",
    xs: "py-1 px-2 text-xs",
    sm: "py-2 px-3 text-sm",
    md: "py-3 px-4",
    lg: "py-4 px-5 text-lg",
    xl: "py-5 px-6 text-xl",
  },
  variants: {
    default: "",
    elevated: "shadow-md hover:shadow-lg",
    plain: "",
    flat: "",
    outlined: "border",
    ghost: "",
    link: "hover:underline",
    icon: "!p-0 [&[data-size=xs]]size-2 [&[data-size=sm]]size-3 [&[data-size=md]]size-4 [&[data-size=lg]]size-5 [&[data-size=xl]]size-6 [&>.label]:sr-only",
  },
  colors: {
    default: [
      "bg-neutral",
      "text-neutral-content",
      "hover:bg-neutral-600",
      "border-neutral-300",
      "hover:border-neutral-100",
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
  rounded: {
    default: "rounded-sm",
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  },
};

// ----------------------------------------------

export default ({ props }) => {
  // Check if weve been provided with style overrides, then merge the default styles with the overrides
  const overrideStyles = get(inject("styles", {}), "button", {});
  const mergedStyles = merge({}, defaultStyles, overrideStyles);

  // -- Remove the variants, sizes, colors and rounded from the root styles as they will be applied conditionally
  const styles = omit(mergedStyles, "sizes", "variants", "colors", "rounded");

  // ----------------------------------------------
  // Conditional styles

  // -- Sizes
  const sizes = pick(mergedStyles, "sizes");
  switch (props.size) {
    case ButtonSize.xs:
      styles.root.concat(sizes.xs);
      break;
    case ButtonSize.sm:
      styles.root.concat(sizes.sm);
      break;
    case ButtonSize.md:
      styles.root.concat(sizes.md);
      break;
    case ButtonSize.lg:
      styles.root.concat(sizes.lg);
      break;
    case ButtonSize.xl:
      styles.root.concat(sizes.xl);
      break;

    default:
      styles.root.concat(sizes.default);
  }

  // --- Variants
  const variants = pick(mergedStyles, "variants");
  switch (props.variant) {
    case ButtonVariant.elevated:
      styles.root.concat(variants.elevated);
      break;
    case ButtonVariant.plain:
      styles.root.concat(variants.plain);
      break;

    case ButtonVariant.outlined:
      styles.root.concat(variants.outlined);
      break;
    case ButtonVariant.ghost:
      styles.root.concat(variants.ghost);
      break;
    case ButtonVariant.link:
      styles.root.concat(variants.link);
      break;

    case ButtonVariant.flat:
      styles.root.concat(variants.flat);
      break;

    default:
      styles.root.concat(variants.default);
      break;
  }

  // --- Color Variants
  const colors = pick(mergedStyles, "colors");
  switch (props.color) {
    case ButtonColor.primary:
      styles.root.concat(colors.primary);
      break;
    case ButtonColor.secondary:
      styles.root.concat(colors.secondary);
      break;
    case ButtonColor.accent:
      styles.root.concat(colors.accent);
      break;
    case ButtonColor.neutral:
      styles.root.concat(colors.neutral);
      break;
    case ButtonColor.success:
      styles.root.concat(colors.success);
      break;
    case ButtonColor.error:
      styles.root.concat(colors.error);
      break;
    case ButtonColor.warning:
      styles.root.concat(colors.warning);
      break;
    case ButtonColor.info:
      styles.root.concat(colors.info);
      break;

    default:
      styles.root.concat(colors.default);
      break;
  }

  // --- Rounded Variants
  const rounded = pick(mergedStyles, "rounded");
  switch (props.rounded) {
    case ButtonSize.xs:
      styles.root.concat(rounded.sm);
      break;
    case ButtonSize.sm:
      styles.root.concat(rounded.sm);
      break;
    case ButtonSize.lg:
      styles.root.concat(rounded.lg);
      break;
    case ButtonSize.xl:
      styles.root.concat(rounded.full);
      break;
    default:
    case ButtonSize.md:
      styles.root.concat(rounded.md);
      break;
    default:
      styles.root.concat(rounded.default);
  }

  // ----------------------------------------------
  return styles;
};
