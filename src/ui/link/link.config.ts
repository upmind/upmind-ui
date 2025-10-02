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
  color: {
    inherit: "",
    neutral: "text-button-link",
    muted: "text-button-muted-link",
    promo: "text-accent-promo",
    danger: "text-accent-danger",
    warning: "text-accent-warning",
    success: "text-accent-success",
    info: "text-accent-info"
  },
  isDisabled: {
    true: "cursor-not-allowed opacity-50",
    false: "cursor-pointer"
  }
};

export const rootVariants = cva(
  `ring-offset-background-canvas button-radius font-medium whitespace-nowrap underline underline-offset-4 transition-all duration-200 [&:hover,&[data-hover=true]]:opacity-75 ${outlineReset} ${focusVisibleRing}`,
  {
    variants,
    defaultVariants: {
      color: "neutral",
      size: "md",
      isDisabled: false
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  link: {
    root: rootVariants
  }
};
