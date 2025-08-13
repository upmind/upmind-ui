// ---  external
import { cva } from "class-variance-authority";
import { ringClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

// --- for out Typescript type
export const avatarVariants = cva(
  "relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden font-normal select-none",
  {
    variants: {
      color: {
        base: "bg-base-muted text-base-muted-foreground",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        promotion: "bg-promotion text-promotion-foreground",
        destructive: "bg-error text-error-foreground",
        success: "bg-success text-success-foreground",
        info: "bg-info text-info-foreground",
        error: "bg-error text-error-foreground",
        warning: "bg-warning text-warning-foreground",
        transparent: "text-primary overflow-visible bg-transparent"
      },
      variant: {
        flat: "",
        outline: "bg-transparent ring-1 ring-inset"
      },
      fit: {
        cover: "object-cover",
        contain: "object-contain p-[0.5em]"
      },
      size: {
        auto: "h-full w-auto text-inherit",
        "4xs": "h-4 w-4 text-xs",
        "3xs": "h-5 w-5 text-xs",
        "2xs": "h-6 w-6 text-xs",
        xs: "h-8 w-8 text-xs",
        sm: "h-12 w-12 text-sm",
        md: "h-16 w-16 text-2xl",
        lg: "h-32 w-32 text-5xl",
        xl: "h-40 w-40 text-6xl",
        "2xl": "h-48 w-48 text-7xl",
        "3xl": "h-56 w-56 text-8xl"
      },
      shape: {
        color: "base",
        circle: "rounded-full",
        square: "rounded-md"
      },
      focusable: {
        true: `${ringClasses}`
      }
    },
    defaultVariants: {
      fit: "cover",
      size: "md",
      shape: "circle",
      variant: "flat"
    },
    compoundVariants: [
      {
        variant: "outline-solid",
        color: "base",
        className: "ring-base-muted text-base-muted"
      },
      {
        variant: "outline-solid",
        color: "primary",
        className: "text-primary ring-primary"
      },
      {
        variant: "outline-solid",
        color: "secondary",
        className: "text-secondary ring-secondary"
      },
      {
        variant: "outline-solid",
        color: "accent",
        className: "text-accent ring-accent"
      },
      {
        variant: "outline-solid",
        color: "promotion",
        className: "text-promotion ring-promotion"
      },
      {
        variant: "outline-solid",
        color: "destructive",
        className: "text-error ring-error"
      },
      {
        variant: "outline-solid",
        color: "success",
        className: "text-success ring-success"
      },
      {
        variant: "outline-solid",
        color: "info",
        className: "text-info ring-info"
      },
      {
        variant: "outline-solid",
        color: "error",
        className: "text-error ring-error"
      },
      {
        variant: "outline-solid",
        color: "warning",
        className: "text-warning ring-warning"
      },
      {
        variant: "outline-solid",
        color: "transparent",
        className: "text-primary ring-primary"
      }
    ]
  }
);

// -----------------------------------------------------------------------------
// --- for our useStyles helper
export default {
  avatar: avatarVariants
};
