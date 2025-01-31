// ---  external
import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const rootVariants = cva(
  `${ringClasses} inline-flex cursor-pointer items-center space-x-1 underline-offset-4 transition-all duration-200`,
  {
    variants: {
      variant: {
        flat: "data-[disabled=true]:opacity-50 data-[disabled=false]:hover:opacity-75",
        muted:
          "opacity-50 data-[disabled=true]:opacity-50 hover:data-[disabled=false]:opacity-100 focus:data-[disabled=false]:opacity-100",
      },
      size: {
        inherit: "text-inherit",
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
      offset: {
        none: "underline-offset-0",
        "2": "underline-offset-2",
        "4": "underline-offset-4",
        "6": "underline-offset-6",
      },
    },
    defaultVariants: {
      size: "inherit",
      offset: "4",
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  link: {
    root: rootVariants,
  },
};
