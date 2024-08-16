// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const buttonConfig = {
  root: cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "hover:bg-primary/90",
          flat: "hover:bg-primary/90",
          outline: "border bg-opacity-0",
          ghost: "",
          link: "underline-offset-4 hover:underline",
          tonal: "border border-transparent",
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

      compoundVariants: [
        {
          color: "accent",
          variant: "outline",
          class: "border-accent text-accent",
        },
        {
          color: "base",
          variant: "outline",
          class: "border-base-foreground text-base-foreground",
        },
        {
          color: "error",
          variant: "outline",
          class: "border-error text-error",
        },
        { color: "info", variant: "outline", class: "border-info text-info" },
        {
          color: "primary",
          variant: "outline",
          class: "border-primary text-primary",
        },
        {
          color: "promotion",
          variant: "outline",
          class: "border-promotion text-promotion",
        },
        {
          color: "secondary",
          variant: "outline",
          class: "border-secondary text-secondary",
        },
        {
          color: "success",
          variant: "outline",
          class: "border-success text-success",
        },
        {
          color: "warning",
          variant: "outline",
          class: "border-warning text-warning",
        },

        {
          color: "accent",
          variant: "tonal",
          class: "bg-accent-50 text-accent",
        },
        {
          color: "base",
          variant: "tonal",
          class: "bg-base-200 text-base-foreground",
        },
        { color: "error", variant: "tonal", class: "bg-error-50 text-error" },
        { color: "info", variant: "tonal", class: "bg-info-50 text-info" },
        {
          color: "primary",
          variant: "tonal",
          class: "bg-primary-50 text-primary",
        },
        {
          color: "promotion",
          variant: "tonal",
          class: "bg-promotion-50 text-promotion",
        },
        {
          color: "secondary",
          variant: "tonal",
          class: "bg-secondary-50 text-secondary",
        },
        {
          color: "success",
          variant: "tonal",
          class: "bg-success-50 text-success",
        },
        {
          color: "warning",
          variant: "tonal",
          class: "bg-warning-50 text-warning",
        },
      ],
      defaultVariants: {
        variant: "default",
        color: "base",
        size: "default",
      },
    }
  ),
};
// -----------------------------------------------------------------------------

export default {
  button: buttonConfig,
};
