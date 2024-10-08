// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// --- for out Typescript type
export const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden font-normal",
  {
    variants: {
      color: {
        base: "bg-base-200 text-base-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        promotion: "bg-promotion text-promotion-foreground",
        destructive: "bg-error text-error-foreground",
        success: "bg-success text-success-foreground",
        info: "bg-info text-info-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground",
      },
      fit: {
        cover: "object-cover",
        contain: "object-contain px-[0.5em]",
      },
      size: {
        full: "h-full w-full text-inherit",
        "3xs": "h-4 w-4 text-xs",
        "2xs": "h-6 w-6 text-xs",
        xs: "h-8 w-8 text-xs",
        sm: "h-12 w-12 text-sm",
        md: "h-16 w-16 text-2xl",
        lg: "h-32 w-32 text-5xl",
      },
      shape: {
        color: "base",
        circle: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      fit: "cover",
      size: "md",
      shape: "circle",
    },
  }
);

// -----------------------------------------------------------------------------
// --- for our useStyles helper
export default {
  avatar: avatarVariants,
};
