// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const buttonConfig = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-primary/90",
        flat: "hover:bg-primary/90",
        outline: "border border-input bg-transparent",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      },
      color: {
        base: "bg-base-foreground text-base-background",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        success: "bg-success text-success-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground",
        info: "bg-info text-info-foreground",
        promotion: "bg-promotion text-promotion-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        md: "h-10 px-4 py-2",
        xs: "h-7 rounded px-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      color: "base",
      size: "default",
    },
  }
);

// -----------------------------------------------------------------------------

export default {
  button: {
    root: buttonConfig,
  },
};
