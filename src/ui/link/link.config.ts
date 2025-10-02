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
    inherit:
      "button-radius underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75",
    neutral:
      "button-radius text-button-link underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75",
    muted:
      "button-radius text-button-muted-link underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75",
    promo:
      "button-radius text-accent-promo underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75",
    danger:
      "button-radius text-accent-danger underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75",
    warning:
      "button-radius text-accent-warning underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75",
    success:
      "button-radius text-accent-success underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75",
    info: "button-radius text-accent-info underline underline-offset-4 [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:opacity-75"
  },
  isDisabled: {
    true: "cursor-not-allowed opacity-50",
    false: "cursor-pointer"
  }
};

export const rootVariants = cva(
  `ring-offset-background-canvas inline-flex items-center font-medium whitespace-nowrap transition-all duration-200 ${outlineReset} ${focusVisibleRing}`,
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
