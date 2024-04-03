// --- global
import { inject, ref, watch } from "vue";

// --- utils
import { generateComponentStyles } from "../../utils";
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
    "!cursor-pointer",
    "hover:-translate-y-0.5",
    "active:-translate-y-px",
  ],
  label: ["font-bold", "flex-1"],
  icon: ["size-[1em]"],
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
    default: [],
    elevated: ["shadow-md", "hover:shadow-lg"],
    flat: [],
    outlined: ["border", "bg-opacity-0", "hover:bg-opacity-100"],
    plain: ["bg-neutral-100", "text-neutral"],
    ghost: ["bg-opacity-0", "text-neutral", "hover:bg-opacity-20"],
    link: ["!bg-transparent", "!text-primary", "hover:underline"],
  },
  colors: {
    default: [
      "bg-neutral",
      "text-neutral-content",
      "data-[variant=outlined]:border-neutral",
      "data-[variant=outlined]:text-neutral",
      "data-[variant=outlined]:hover:text-neutral-content",
      "data-[variant=ghost]:text-neutral",
      "data-[variant=ghost]:hover:text-neutral",
      "data-[variant=plain]:text-neutral",
      "data-[variant=plain]:hover:text-neutral-content",
      "hover:bg-neutral-600",
      "hover:text-neutral-content",
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
    icon: [
      "!p-0",
      "size-12",
      "data-[size=xs]:size-8",
      "data-[size=sm]:size-10",
      "data-[size=md]:size-12",
      "data-[size=lg]:size-14",
      "data-[size=xl]:size-16",
      "[&>.btn-label]:sr-only",
      "[&>.btn-icon]:size-full",
      "[&>.btn-icon]:p-[0.75em]",
      "rounded-full",
    ],
  },
};

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
  const overrideStyles = inject("upwind", {});

  const styles = ref();
  styles.value = applyStyles(
    generateComponentStyles("button", defaultStyles, overrideStyles),
    context
  );

  // Watch for changes in the override styles
  watch(overrideStyles, () => {
    styles.value = applyStyles(
      generateComponentStyles("button", defaultStyles, overrideStyles),
      context
    );
  });

  return styles;
};
