// ---  external
import { cva } from "class-variance-authority";
import { focusVisibleRing, outlineReset } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const variants = {
  size: {
    inherit: "",
    sm: "text-sm",
    md: "text-sm",
    lg: "text-md"
  },
  hasIcon: {
    true: "",
    false: ""
  },
  color: {
    inherit: "[&:hover,&[data-hover=true]]:opacity-75",
    default:
      "text-button-link [&:hover,&[data-hover=true]]:text-button-link-hover group-hover:text-button-link-hover",
    muted:
      "text-button-muted-link [&:hover,&[data-hover=true]]:text-button-muted-link-hover",
    promo: "text-accent-promo [&:hover,&[data-hover=true]]:opacity-75",
    danger: "text-accent-danger [&:hover,&[data-hover=true]]:opacity-75",
    warning: "text-accent-warning [&:hover,&[data-hover=true]]:opacity-75",
    success: "text-accent-success [&:hover,&[data-hover=true]]:opacity-75",
    info: "text-accent-info [&:hover,&[data-hover=true]]:opacity-75"
  },
  isDisabled: {
    true: "cursor-not-allowed opacity-50",
    false: "cursor-pointer"
  }
};

const itemsVariants = cva("size-lh flex items-center justify-center", {
  variants: {
    size: {
      icon: "",
      sm: "[&>i]:p-[3px]",
      md: "[&>i]:p-[3px]",
      lg: "[&>i]:p-[4px]"
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
  `ring-offset-background-canvas button-radius font-medium whitespace-nowrap underline underline-offset-4 transition-all duration-200 ${outlineReset} ${focusVisibleRing} `,
  {
    variants: {
      size: variants.size,
      color: variants.color,
      isDisabled: variants.isDisabled,
      hasIcon: {
        true: "inline-flex items-center debug-has-icon-true",
        false: "inline-flex items-center debug-has-icon-false"
      }
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
        class: "gap-0.5"
      },
      {
        hasIcon: true,
        size: "lg",
        class: "gap-0.5"
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
