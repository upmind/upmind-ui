// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const rootVariants = cva(
  `inline-flex cursor-pointer items-center space-x-0.5 font-medium underline underline-offset-4 outline-none transition-all duration-200 focus:outline-none`,
  {
    variants: {
      variant: {
        flat: "data-[disabled=true]:opacity-50 data-[disabled=false]:hover:opacity-75",
        muted:
          "opacity-50 data-[disabled=true]:opacity-50 hover:data-[disabled=false]:opacity-100 focus:data-[disabled=false]:opacity-100"
      },
      size: {
        inherit: "",
        "2xs": "text-2xs",
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl"
      },
      offset: {
        none: "underline-offset-0",
        "2": "underline-offset-2",
        "4": "underline-offset-4",
        "6": "underline-offset-6"
      },
      color: {
        inherit: "text-inherit",
        base: "text-base-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
        promotion: "text-promotion",
        destructive: "text-destructive",
        success: "text-success",
        info: "text-info",
        error: "text-error",
        warning: "text-warning"
      }
    },
    defaultVariants: {
      variant: "flat",
      color: "inherit",
      size: "inherit",
      offset: "4"
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  link: {
    root: rootVariants
  }
};
