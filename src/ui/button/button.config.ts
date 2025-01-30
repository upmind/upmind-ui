// ---  external
import { cva } from "class-variance-authority";
import { invalidRingClasses, ringClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const buttonVariants = cva(
  `relative inline-flex items-center justify-center whitespace-nowrap rounded-md border font-medium no-underline ring-offset-background transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:!opacity-50`,
  {
    variants: {
      variant: {
        flat: "border-transparent hover:bg-opacity-90",
        outline: "bg-transparent",
        ghost: "border-transparent",
        link: "!hover:underline border-none !bg-transparent !px-0 !underline-offset-4 hover:text-opacity-70 focus:outline-offset-4",
        tonal: "border-transparent",
        inverse: "border-transparent",
        control:
          "hover:!border-control-strong !border-control bg-control !text-control-foreground shadow-sm ring-offset-background",
      },
      focusable: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false: "outline-none focus:outline-none focus:ring-0",
      },
      color: {
        base: "",
        primary: "!ring-primary",
        secondary: "!ring-secondary",
        accent: "!ring-accent",
        promotion: "!ring-promotion",
        destructive: "!ring-destructive",
        success: "!ring-success",
        info: "!ring-info",
        error: "!ring-error",
        warning: "!ring-warning",
      },
      size: {
        xs: "h-7 gap-1 px-2 py-1 text-xs",
        sm: "h-9 gap-2 px-3 py-1 text-sm",
        md: "h-10 gap-2 px-4 py-1 text-md",
        lg: "h-11 gap-2 px-8 py-1 text-lg",
        xl: "h-14 gap-2 px-8 py-1 text-lg",
        icon: "h-10 w-10 gap-2 px-2 py-1",
        badge: "gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
      },
      block: {
        true: "w-full basis-full",
      },
      loading: {
        true: "pointer-events-none [&>:not(.spinner)]:opacity-50",
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
        class:
          "hover:bg-base-muted border-base-foreground text-base-foreground",
      },
      {
        color: "primary",
        variant: "outline",
        class: "hover:bg-primary-muted border-primary text-primary",
      },
      {
        color: "secondary",
        variant: "outline",
        class: "hover:bg-secondary-muted border-secondary text-secondary",
      },
      {
        color: "accent",
        variant: "outline",
        class: "hover:bg-accent-muted border-accent text-accent",
      },
      {
        color: "promotion",
        variant: "outline",
        class: "hover:bg-promotion-muted border-promotion text-promotion",
      },
      {
        color: "destructive",
        variant: "outline",
        class: "hover:bg-destructive-muted border-destructive text-destructive",
      },
      {
        color: "success",
        variant: "outline",
        class: "hover:bg-success-muted border-success text-success",
      },
      {
        color: "info",
        variant: "outline",
        class: "hover:bg-info-muted border-info text-info",
      },
      {
        color: "error",
        variant: "outline",
        class: "hover:bg-error-muted border-error text-error",
      },
      {
        color: "warning",
        variant: "outline",
        class: "hover:bg-warning-muted border-warning text-warning",
      },

      // --- tonal
      {
        color: "base",
        variant: "tonal",
        class:
          "bg-base-muted hover:bg-base-muted-active text-base-muted-foreground",
      },
      {
        color: "primary",
        variant: "tonal",
        class:
          "bg-primary-muted hover:bg-primary-muted-active text-primary-muted-foreground",
      },
      {
        color: "secondary",
        variant: "tonal",
        class:
          "bg-secondary-muted hover:bg-secondary-muted-active text-secondary-muted-foreground",
      },
      {
        color: "accent",
        variant: "tonal",
        class:
          "bg-accent-muted hover:bg-accent-muted-active text-accent-muted-foreground",
      },
      {
        color: "promotion",
        variant: "tonal",
        class:
          "bg-promotion-muted hover:bg-promotion-muted-active text-promotion-muted-foreground",
      },
      {
        color: "destructive",
        variant: "tonal",
        class:
          "bg-destructive-muted hover:bg-destructive-muted-active text-destructive-muted-foreground",
      },
      {
        color: "success",
        variant: "tonal",
        class:
          "bg-success-muted hover:bg-success-muted-active text-success-muted-foreground",
      },
      {
        color: "info",
        variant: "tonal",
        class:
          "bg-info-muted hover:bg-info-muted-active text-info-muted-foreground",
      },
      {
        color: "error",
        variant: "tonal",
        class:
          "bg-error-muted hover:bg-error-muted-active text-error-muted-foreground",
      },
      {
        color: "warning",
        variant: "tonal",
        class:
          "bg-warning-muted hover:bg-warning-muted-active text-warning-muted-foreground",
      },

      // --- ghost
      {
        color: "base",
        variant: "ghost",
        class: "hover:bg-base-muted text-base-foreground",
      },
      {
        color: "primary",
        variant: "ghost",
        class: "hover:bg-primary-muted text-primary",
      },
      {
        color: "secondary",
        variant: "ghost",
        class: "hover:bg-secondary-muted text-secondary",
      },
      {
        color: "accent",
        variant: "ghost",
        class: "hover:bg-accent-muted text-accent",
      },
      {
        color: "promotion",
        variant: "ghost",
        class: "hover:bg-promotion-muted text-promotion ",
      },
      {
        color: "destructive",
        variant: "ghost",
        class: "hover:bg-destructive-muted text-destructive ",
      },

      {
        color: "success",
        variant: "ghost",
        class: "hover:bg-success-muted text-success",
      },
      {
        color: "info",
        variant: "ghost",
        class: "hover:bg-info-muted text-info",
      },
      {
        color: "error",
        variant: "ghost",
        class: "hover:bg-error-muted text-error ",
      },
      {
        color: "warning",
        variant: "ghost",
        class: "hover:bg-warning-muted text-warning",
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

      // --- inverse
      {
        color: "base",
        variant: "inverse",
        class:
          "hover:bg-base-muted-active bg-base-background text-base-foreground",
      },
      {
        color: "primary",
        variant: "inverse",
        class: "hover:bg-primary-muted bg-primary-foreground text-primary",
      },
      {
        color: "secondary",
        variant: "inverse",
        class:
          "hover:bg-secondary-muted bg-secondary-foreground text-secondary",
      },
      {
        color: "accent",
        variant: "inverse",
        class: "hover:bg-accent-muted bg-accent-foreground text-accent",
      },
      {
        color: "promotion",
        variant: "inverse",
        class:
          "hover:bg-promotion-muted bg-promotion-foreground text-promotion",
      },
      {
        color: "destructive",
        variant: "inverse",
        class:
          "hover:bg-destructive-muted bg-destructive-foreground text-destructive",
      },
      {
        color: "success",
        variant: "inverse",
        class: "hover:bg-success-muted bg-success-foreground text-success",
      },
      {
        color: "info",
        variant: "inverse",
        class: "hover:bg-info-muted bg-info-foreground text-info",
      },
      {
        color: "error",
        variant: "inverse",
        class: "hover:bg-error-muted bg-error-foreground text-error",
      },
      {
        color: "warning",
        variant: "inverse",
        class: "hover:bg-warning-muted bg-warning-foreground text-warning",
      },

      // ... existing compound variants ...
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

// -----------------------------------------------------------------------------
export default {
  button: buttonVariants,
};
