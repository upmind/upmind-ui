// ---  external
import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const variants = {
  size: {
    inherit: "",
    sm: "text-sm",
    md: "gap-0.5 text-sm",
    lg: "text-md gap-0.5"
  },
  color: {
    neutral:
      "button-radius text-button-link  p-0 underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:brightness-125",
    muted:
      "button-radius text-button-muted-link p-0 underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:brightness-125",
    promo:
      "button-radius text-accent-promo p-0 underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:brightness-125",
    danger:
      "button-radius text-accent-danger p-0 underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:brightness-125",
    warning:
      "button-radius text-accent-warning p-0 underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:brightness-125",
    success:
      "button-radius text-accent-success p-0 underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:brightness-125",
    info: "button-radius text-accent-info p-0 underline underline-offset-4 !shadow-none !ring-0 !ring-offset-0 !outline-none [&:focus,&[data-focus=true],&:hover,&[data-hover=true]]:brightness-125"
  },
  isDisabled: {
    true: "cursor-not-allowed opacity-50",
    false: "cursor-pointer"
  }
};

export const rootVariants = cva(
  `ring-offset-background-canvas relative inline-flex items-center font-medium whitespace-nowrap no-underline transition-all duration-300 ${ringClasses}`,
  {
    variants,
    defaultVariants: {
      color: "neutral",
      size: "md",
      isDisabled: false
    }
  }
);

const labelVariants = cva("");

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

// -----------------------------------------------------------------------------
export default {
  link: {
    root: rootVariants,
    label: labelVariants,
    items: itemsVariants
  }
};
