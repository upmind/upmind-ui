// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const buttonVariants = cva(
  "relative inline-flex items-center justify-center space-x-2 whitespace-nowrap rounded-md border font-medium no-underline ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:!opacity-50",
  {
    variants: {
      variant: {
        flat: "border-transparent hover:bg-opacity-90",
        outline: "bg-transparent",
        ghost: "border-transparent",
        link: "border-none !bg-transparent !px-0",
        tonal: "border-transparent",
      },
      color: {
        base: "",
        primary: "",
        secondary: "",
        accent: "",
        promotion: "",
        destructive: "",
        success: "",
        info: "",
        error: "",
        warning: "",
      },
      size: {
        xs: "h-7 gap-x-1 px-2 py-1 text-xs",
        sm: "h-9 gap-x-2 px-3 py-1 text-sm",
        md: "h-10 gap-x-2 px-4 py-1 text-md",
        lg: "h-11 gap-x-2 px-8 py-1 text-lg",
        xl: "h-14 gap-x-3 px-8 py-2 text-lg",
        icon: "h-10 w-10 gap-x-2 px-2 py-1 ",
        badge: "px-1 py-0 text-xs",
      },
      block: {
        true: "w-full basis-full",
      },
    },

    compoundVariants: [
      //  --- flat
      {
        color: "base",
        variant: "flat",
        class: "bg-base-foreground text-base-background",
      },
      {
        color: "primary",
        variant: "flat",
        class: "bg-primary text-primary-foreground",
      },
      {
        color: "secondary",
        variant: "flat",
        class: "bg-secondary text-secondary-foreground",
      },
      {
        color: "accent",
        variant: "flat",
        class: "bg-accent text-accent-foreground",
      },
      {
        color: "promotion",
        variant: "flat",
        class: "bg-promotion text-promotion-foreground",
      },
      {
        color: "destructive",
        variant: "flat",
        class: "bg-destructive text-destructive-foreground",
      },
      {
        color: "success",
        variant: "flat",
        class: "bg-success text-success-foreground",
      },
      { color: "info", variant: "flat", class: "bg-info text-info-foreground" },
      {
        color: "error",
        variant: "flat",
        class: "bg-error text-error-foreground",
      },
      {
        color: "warning",
        variant: "flat",
        class: "bg-warning text-warning-foreground",
      },

      // --- outline
      {
        color: "base",
        variant: "outline",
        class: "border-base-foreground text-base-foreground hover:bg-base-200",
      },
      {
        color: "primary",
        variant: "outline",
        class: "border-primary text-primary hover:bg-primary-50",
      },
      {
        color: "secondary",
        variant: "outline",
        class: "border-secondary text-secondary hover:bg-secondary-50",
      },
      {
        color: "accent",
        variant: "outline",
        class: "border-accent text-accent hover:bg-accent-50",
      },
      {
        color: "promotion",
        variant: "outline",
        class: "border-promotion text-promotion hover:bg-promotion-50",
      },
      {
        color: "destructive",
        variant: "outline",
        class: "border-destructive text-destructive hover:bg-destructive-50",
      },
      {
        color: "success",
        variant: "outline",
        class: "border-success text-success hover:bg-success-50",
      },
      {
        color: "info",
        variant: "outline",
        class: "border-info text-info hover:bg-info-50",
      },
      {
        color: "error",
        variant: "outline",
        class: "border-error text-error hover:bg-error-50",
      },
      {
        color: "warning",
        variant: "outline",
        class: "border-warning text-warning hover:bg-warning-50",
      },

      // --- tonal
      {
        color: "base",
        variant: "tonal",
        class: "bg-base-200 text-base-foreground hover:bg-base-300",
      },
      {
        color: "primary",
        variant: "tonal",
        class: "bg-primary-50 text-primary hover:bg-primary-100",
      },
      {
        color: "secondary",
        variant: "tonal",
        class: "bg-secondary-50 text-secondary hover:bg-secondary-100",
      },
      {
        color: "accent",
        variant: "tonal",
        class: "bg-accent-50 text-accent hover:bg-accent-100",
      },
      {
        color: "promotion",
        variant: "tonal",
        class: "bg-promotion-50 text-promotion hover:bg-promotion-100",
      },
      {
        color: "destructive",
        variant: "tonal",
        class: "bg-destructive-50 text-destructive hover:bg-destructive-100",
      },
      {
        color: "success",
        variant: "tonal",
        class: "bg-success-50 text-success hover:bg-success-100",
      },
      {
        color: "info",
        variant: "tonal",
        class: "bg-info-50 text-info hover:bg-info-100",
      },
      {
        color: "error",
        variant: "tonal",
        class: "bg-error-50 text-error hover:bg-error-100",
      },
      {
        color: "warning",
        variant: "tonal",
        class: "bg-warning-50 text-warning hover:bg-warning-100",
      },

      // --- ghost
      {
        color: "base",
        variant: "ghost",
        class: "text-base-foreground hover:bg-base-50",
      },
      {
        color: "primary",
        variant: "ghost",
        class: "text-primary hover:bg-primary-50",
      },
      {
        color: "secondary",
        variant: "ghost",
        class: "text-secondary hover:bg-secondary-50",
      },
      {
        color: "accent",
        variant: "ghost",
        class: "text-accent hover:bg-accent-50",
      },
      {
        color: "promotion",
        variant: "ghost",
        class: "text-promotion hover:bg-promotion-50 ",
      },
      {
        color: "destructive",
        variant: "ghost",
        class: "text-destructive hover:bg-destructive-50 ",
      },

      {
        color: "success",
        variant: "ghost",
        class: "text-success hover:bg-success-50",
      },
      {
        color: "info",
        variant: "ghost",
        class: "text-info hover:bg-info-50",
      },
      {
        color: "error",
        variant: "ghost",
        class: "text-error hover:bg-error-50 ",
      },
      {
        color: "warning",
        variant: "ghost",
        class: "text-warning hover:bg-warning-50",
      },

      // --- link
      {
        color: "base",
        variant: "link",
        class: "bg-transparent text-base-foreground",
      },
      {
        color: "primary",
        variant: "link",
        class: "bg-transparent text-primary",
      },
      {
        color: "secondary",
        variant: "link",
        class: "bg-transparent text-secondary",
      },
      {
        color: "accent",
        variant: "link",
        class: "bg-transparent text-accent",
      },
      {
        color: "promotion",
        variant: "link",
        class: "bg-transparent text-promotion",
      },
      {
        color: "destructive",
        variant: "link",
        class: "bg-transparent text-destructive",
      },
      {
        color: "success",
        variant: "link",
        class: "bg-transparent text-success",
      },
      { color: "info", variant: "link", class: "bg-transparent text-info" },
      { color: "error", variant: "link", class: "bg-transparent text-error" },
      {
        color: "warning",
        variant: "link",
        class: "bg-transparent text-warning",
      },
    ],

    defaultVariants: {
      block: false,
      variant: "flat",
      color: "base",
      size: "md",
      loading: false,
    },
  }
);

export const contentVariants = cva(
  "inline-flex w-full items-center justify-center whitespace-nowrap font-medium",
  {
    variants: {
      variant: {
        link: "underline-offset-4 hover:underline",
      },
      loading: {
        true: "select-none opacity-0",
        false: "",
      },
    },
  }
);

// -----------------------------------------------------------------------------
export default {
  button: buttonVariants,
  content: contentVariants,
};
