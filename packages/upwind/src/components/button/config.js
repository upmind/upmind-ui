export default {
  root: [
    "align-bottom",
    "gap-x-2",
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
  label: ["font-semibold"],
  icon: ["size-[1.25em]"],
  loading: ["size-4", "opacity-80"],
  // badge: ["size-4", "leading-none", "flex", "items-center", "justify-center"],
  // ---
  sizes: {
    default: ["py-3", "px-4", "text-sm"],
    sm: ["py-2", "px-3", "text-sm"],
    lg: ["py-4", "px-5", "text-sm"],
    block: ["py-4", "px-5", "text-sm", "w-full", "flex"],
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
  variants: {
    default: ["border-transparent"],
    flat: ["border-transparent"],
    outlined: ["border", "!bg-opacity-0"],
    ghost: ["bg-opacity-0", "border-transparent"],
    plain: ["border-transparent"],
    elevated: ["border-transparent", "shadow-md", "hover:shadow-lg"],
    link: ["!bg-transparent", "hover:underline"],
  },
  colors: {
    default: [
      "bg-neutral-600",
      "text-neutral-content",
      "hover:bg-neutral-700",
      "hover:text-neutral-content",
      "border-transparent",

      "disabled:hover:bg-neutral-600",

      "data-[variant=outlined]:border-neutral-500",
      "data-[variant=outlined]:text-neutral-500",
      "data-[variant=outlined]:hover:border-neutral-400",
      "data-[variant=outlined]:hover:text-neutral-400",

      "data-[variant=ghost]:text-neutral-500",
      "data-[variant=ghost]:hover:bg-neutral-100",
      "data-[variant=ghost]:hover:text-neutral-800",

      "data-[variant=plain]:bg-neutral-100",
      "data-[variant=plain]:text-neutral-800",
      "data-[variant=plain]:hover:bg-neutral-200",

      "data-[variant=link]:text-neutral",
    ],
    disabled: [
      "opacity-50",
      "cursor-not-allowed",
      "hover:translate-y-0",
      "active:translate-y-0",
    ],
    primary: [
      "bg-primary",
      "text-primary-content",
      "hover:bg-primary-600",
      "border-primary-300",
      "hover:border-primary-100",

      "disabled:hover:bg-primary",

      "data-[variant=outlined]:border-primary-500",
      "data-[variant=outlined]:text-primary-500",
      "data-[variant=outlined]:hover:border-primary-400",
      "data-[variant=outlined]:hover:text-primary-400",

      "data-[variant=ghost]:text-primary-500",
      "data-[variant=ghost]:hover:bg-primary-100",
      "data-[variant=ghost]:hover:text-primary-800",

      "data-[variant=plain]:bg-primary-100",
      "data-[variant=plain]:text-primary-800",
      "data-[variant=plain]:hover:bg-primary-200",

      "data-[variant=link]:text-primary",
    ],
    secondary: [
      "bg-secondary",
      "text-secondary-content",
      "hover:bg-secondary-600",
      "border-secondary-300",
      "hover:border-secondary-100",

      "disabled:hover:bg-secondary",

      "data-[variant=outlined]:border-secondary-500",
      "data-[variant=outlined]:text-secondary-500",
      "data-[variant=outlined]:hover:border-secondary-400",
      "data-[variant=outlined]:hover:text-secondary-400",

      "data-[variant=ghost]:text-secondary-500",
      "data-[variant=ghost]:hover:bg-secondary-100",
      "data-[variant=ghost]:hover:text-secondary-800",

      "data-[variant=plain]:bg-secondary-100",
      "data-[variant=plain]:text-secondary-800",
      "data-[variant=plain]:hover:bg-secondary-200",

      "data-[variant=link]:text-secondary",
    ],
    accent: [
      "bg-accent",
      "text-accent-content",
      "hover:bg-accent-600",
      "border-accent-300",
      "hover:border-accent-100",

      "disabled:hover:bg-accent",

      "data-[variant=outlined]:border-accent-500",
      "data-[variant=outlined]:text-accent-500",
      "data-[variant=outlined]:hover:border-accent-400",
      "data-[variant=outlined]:hover:text-accent-400",

      "data-[variant=ghost]:text-accent-500",
      "data-[variant=ghost]:hover:bg-accent-100",
      "data-[variant=ghost]:hover:text-accent-800",

      "data-[variant=plain]:bg-accent-100",
      "data-[variant=plain]:text-accent-800",
      "data-[variant=plain]:hover:bg-accent-200",

      "data-[variant=link]:text-accent",
    ],
    neutral: [
      "bg-neutral",
      "text-neutral-content",
      "hover:bg-neutral-600",
      "border-neutral-300",
      "hover:border-neutral-100",

      "disabled:hover:bg-neutral",

      "data-[variant=outlined]:border-neutral-500",
      "data-[variant=outlined]:text-neutral-500",
      "data-[variant=outlined]:hover:border-neutral-400",
      "data-[variant=outlined]:hover:text-neutral-400",

      "data-[variant=ghost]:text-neutral-500",
      "data-[variant=ghost]:hover:bg-neutral-100",
      "data-[variant=ghost]:hover:text-neutral-800",

      "data-[variant=plain]:bg-neutral-100",
      "data-[variant=plain]:text-neutral-800",
      "data-[variant=plain]:hover:bg-neutral-200",

      "data-[variant=link]:text-neutral",
    ],
    success: [
      "bg-success",
      "text-success-content",
      "hover:bg-success-600",
      "border-success-300",
      "hover:border-success-100",

      "disabled:hover:bg-success",

      "data-[variant=outlined]:border-success-500",
      "data-[variant=outlined]:text-success-500",
      "data-[variant=outlined]:hover:border-success-400",
      "data-[variant=outlined]:hover:text-success-400",

      "data-[variant=ghost]:text-success-500",
      "data-[variant=ghost]:hover:bg-success-100",
      "data-[variant=ghost]:hover:text-success-800",

      "data-[variant=plain]:bg-success-100",
      "data-[variant=plain]:text-success-800",
      "data-[variant=plain]:hover:bg-success-200",

      "data-[variant=link]:text-success",
    ],
    error: [
      "bg-error",
      "text-error-content",
      "hover:bg-error-600",
      "border-error-300",
      "hover:border-error-100",

      "disabled:hover:bg-error",

      "data-[variant=outlined]:border-error-500",
      "data-[variant=outlined]:text-error-500",
      "data-[variant=outlined]:hover:border-error-400",
      "data-[variant=outlined]:hover:text-error-400",

      "data-[variant=ghost]:text-error-500",
      "data-[variant=ghost]:hover:bg-error-100",
      "data-[variant=ghost]:hover:text-error-800",

      "data-[variant=plain]:bg-error-100",
      "data-[variant=plain]:text-error-800",
      "data-[variant=plain]:hover:bg-error-200",

      "data-[variant=link]:text-error",
    ],
    warning: [
      "bg-warning",
      "text-warning-content",
      "hover:bg-warning-600",
      "border-warning-300",
      "hover:border-warning-100",

      "disabled:hover:bg-warning",

      "data-[variant=outlined]:border-warning-500",
      "data-[variant=outlined]:text-warning-500",
      "data-[variant=outlined]:hover:border-warning-400",
      "data-[variant=outlined]:hover:text-warning-400",

      "data-[variant=ghost]:text-warning-500",
      "data-[variant=ghost]:hover:bg-warning-100",
      "data-[variant=ghost]:hover:text-warning-800",

      "data-[variant=plain]:bg-warning-100",
      "data-[variant=plain]:text-warning-800",
      "data-[variant=plain]:hover:bg-warning-200",

      "data-[variant=link]:text-warning",
    ],
    info: [
      "bg-info",
      "text-info-content",
      "hover:bg-info-600",
      "border-info-300",
      "hover:border-info-100",

      "disabled:hover:bg-info",

      "data-[variant=outlined]:border-info-500",
      "data-[variant=outlined]:text-info-500",
      "data-[variant=outlined]:hover:border-info-400",
      "data-[variant=outlined]:hover:text-info-400",

      "data-[variant=ghost]:text-info-500",
      "data-[variant=ghost]:hover:bg-info-100",
      "data-[variant=ghost]:hover:text-info-800",

      "data-[variant=plain]:bg-info-100",
      "data-[variant=plain]:text-info-800",
      "data-[variant=plain]:hover:bg-info-200",

      "data-[variant=link]:text-info",
    ],
  },
  shapes: {
    default: ["rounded-lg"],
    none: ["rounded-none"],
    xs: ["rounded-xs"],
    sm: ["rounded-sm"],
    md: ["rounded-md"],
    lg: ["rounded-lg"],
    xl: ["rounded-xl"],
    pill: ["rounded-full"],
  },
};
