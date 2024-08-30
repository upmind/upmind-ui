// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const buttonConfig = cva(
  "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:!opacity-50",
  {
    variants: {
      variant: {
        flat: "border-transparent hover:bg-opacity-90",
        outline: "bg-opacity-0 hover:border-opacity-80 hover:text-opacity-80",
        ghost: "border-transparent bg-opacity-0 hover:bg-opacity-90",
        link: "border-transparent bg-transparent underline-offset-4 hover:underline",
        tonal: "border border-transparent",
      },
      color: {
        base: "text-base-background bg-base-foreground",
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
      size: {
        md: "h-10 gap-x-2 px-4 py-1",
        xs: "h-7 gap-x-1 px-2 py-1",
        sm: "h-9 gap-x-2 px-3 py-1",
        lg: "h-11 gap-x-2 px-8 py-1",
        icon: "h-10 w-10 gap-x-2 px-2 py-1 ",
      },
      block: {
        true: "w-full basis-full",
      },
    },

    compoundVariants: [
      // --- outline
      {
        color: "base",
        variant: "outline",
        class: "border-base-foreground text-base-foreground",
      },
      {
        color: "primary",
        variant: "outline",
        class: "border-primary text-primary",
      },
      {
        color: "secondary",
        variant: "outline",
        class: "border-secondary text-secondary",
      },
      {
        color: "accent",
        variant: "outline",
        class: "border-accent text-accent",
      },
      {
        color: "promotion",
        variant: "outline",
        class: "border-promotion text-promotion",
      },
      {
        color: "destructive",
        variant: "outline",
        class: "border-error text-error",
      },
      {
        color: "success",
        variant: "outline",
        class: "border-success text-success",
      },
      { color: "info", variant: "outline", class: "border-info text-info" },
      {
        color: "error",
        variant: "outline",
        class: "border-error text-error",
      },
      {
        color: "warning",
        variant: "outline",
        class: "border-warning text-warning",
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
        class: "bg-error-50 text-error hover:bg-error-100",
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
        class: "bg-base-200 text-base-foreground",
      },
      {
        color: "primary",
        variant: "ghost",
        class: "bg-primary-50 text-primary",
      },
      {
        color: "secondary",
        variant: "ghost",
        class: "bg-secondary-50 text-secondary",
      },
      {
        color: "accent",
        variant: "ghost",
        class: "bg-accent-50 text-accent",
      },
      {
        color: "promotion",
        variant: "ghost",
        class: "bg-promotion-50 text-promotion",
      },
      {
        color: "destructive",
        variant: "ghost",
        class: "bg-error-50 text-error",
      },

      {
        color: "success",
        variant: "ghost",
        class: "bg-success-50 text-success",
      },
      { color: "info", variant: "ghost", class: "bg-info-50 text-info" },
      { color: "error", variant: "ghost", class: "bg-error-50 text-error" },
      {
        color: "warning",
        variant: "ghost",
        class: "bg-warning-50 text-warning",
      },

      // --- link
      {
        color: "base",
        variant: "link",
        class: "text-base-foreground bg-transparent",
      },
      {
        color: "primary",
        variant: "link",
        class: "text-primary bg-transparent",
      },
      {
        color: "secondary",
        variant: "link",
        class: "text-secondary bg-transparent",
      },
      {
        color: "accent",
        variant: "link",
        class: "text-accent bg-transparent",
      },
      {
        color: "promotion",
        variant: "link",
        class: "text-promotion bg-transparent",
      },
      {
        color: "destructive",
        variant: "link",
        class: "text-error bg-transparent",
      },
      {
        color: "success",
        variant: "link",
        class: "text-success bg-transparent",
      },
      { color: "info", variant: "link", class: "text-info bg-transparent" },
      { color: "error", variant: "link", class: "text-error bg-transparent" },
      {
        color: "warning",
        variant: "link",
        class: "text-warning bg-transparent",
      },
    ],

    defaultVariants: {
      variant: "flat",
      color: "base",
      size: "md",
    },
  }
);
// -----------------------------------------------------------------------------

export default {
  button: {
    root: buttonConfig,
    label: cva("truncate"),
  },
};
