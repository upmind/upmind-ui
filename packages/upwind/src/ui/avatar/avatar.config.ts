// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const avatarConfig = cva(
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
        xs: "h-6 w-6 text-xs",
        sm: "h-10 w-10 text-sm",
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
export default {
  avatar: {
    root: avatarConfig,
    icon: {
      root: cva("relative z-10 h-full w-full object-cover"),
    },
    caption: cva(
      "absolute bottom-0 left-0 right-0 top-0 z-0 inline-flex items-center justify-center text-center"
    ),
    image: cva("relative z-10 h-full w-full object-cover"),
  },
};
