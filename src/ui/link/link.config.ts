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

export const rootVariants = cva(
  `ring-offset-background-canvas button-radius font-medium whitespace-nowrap underline underline-offset-4 transition-all duration-200 ${outlineReset} ${focusVisibleRing}`,
  {
    variants,
    defaultVariants: {
      color: "default",
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
