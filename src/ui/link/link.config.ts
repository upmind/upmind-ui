// ---  external
import { cva } from "class-variance-authority";
import { outlineReset } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const variants = {
  size: {
    inherit: "",
    sm: "text-sm",
    md: "text-md",
    lg: "text-md"
  },
  hasIcon: {
    true: "",
    false: ""
  },
  color: {
    inherit:
      "[&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:opacity-75",
    default:
      "text-button-link [&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:text-button-link-hover [&:not([aria-disabled=true])]:group-hover:text-button-link-hover",
    muted:
      "text-button-muted-link [&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:text-button-muted-link-hover",
    promo:
      "text-accent-promo [&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:opacity-75",
    danger:
      "text-accent-danger [&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:opacity-75",
    warning:
      "text-accent-warning [&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:opacity-75",
    success:
      "text-accent-success [&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:opacity-75",
    info: "text-accent-info [&:not([aria-disabled=true]):hover,&:not([aria-disabled=true])[data-hover=true]]:opacity-75"
  },
  isDisabled: {
    true: "cursor-not-allowed opacity-50",
    false: "cursor-pointer"
  },
  hasRing: {
    true: `${outlineReset} focus-visible:ring-2 focus-visible:ring-control-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface`,
    false: "outline-none focus:ring-0 focus:outline-none"
  },
  hasFocusRing: {
    true: `${outlineReset} focus:ring-2 focus:ring-control-ring focus:ring-offset-2 focus:ring-offset-surface`,
    false: ""
  }
};

const itemsVariants = cva("size-lh flex items-center justify-center", {
  variants: {
    size: {
      icon: "",
      sm: "[&>i]:p-[3px]",
      md: "[&>i]:p-[4px]",
      lg: "[&>i]:p-[4px]",
      inherit: "[&>i]:p-[4px]"
    },
    color: {
      neutral: "text-button-link",
      promo: "text-accent-promo",
      danger: "text-accent-danger",
      warning: "text-accent-warning",
      success: "text-accent-success",
      info: "text-accent-info"
    }
  }
});

export const rootVariants = cva(
  `ring-offset-bg-canvas button-radius underline underline-offset-4 transition-all duration-200 focus-visible:ring-offset-4`,
  {
    variants: {
      size: variants.size,
      color: variants.color,
      isDisabled: variants.isDisabled,
      hasIcon: {
        true: "inline-flex items-center",
        false: "inline-flex items-center"
      },
      hasRing: variants.hasRing,
      hasFocusRing: variants.hasFocusRing
    },
    defaultVariants: {
      color: "default",
      size: "md",
      isDisabled: false,
      hasIcon: false
    },
    compoundVariants: [
      {
        hasIcon: true,
        size: "md",
        class: "gap-1"
      },
      {
        hasIcon: true,
        size: "lg",
        class: "gap-1"
      }
    ]
  }
);

// -----------------------------------------------------------------------------
export default {
  link: {
    root: rootVariants,
    items: itemsVariants
  }
};
