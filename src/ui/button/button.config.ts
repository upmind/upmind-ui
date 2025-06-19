// ---  external
import { cva } from "class-variance-authority";
import { invalidRingClasses, ringClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const buttonVariants = cva(
  `relative inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-transparent font-medium no-underline ring-offset-background transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:!opacity-50`,
  {
    variants: {
      variant: {
        flat: "border-transparent hover:bg-opacity-90",
        outline: "bg-transparent",
        ghost: "border-transparent",
        link: "!hover:underline border-none !bg-transparent !px-0 !underline-offset-4 hover:text-opacity-60",
        tonal: "border-transparent",
        inverse: "border-transparent",
        control:
          "hover:!border-control-strong !border-control-border bg-control !text-control-foreground shadow-sm ring-offset-background",
      },
      focusable: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false: "outline-none focus:outline-none focus:ring-0",
      },
      color: {
        base: "!ring-base",
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
        class: "bg-base-foreground text-base-background !ring-base",
      },
      {
        color: "primary",
        variant: "flat",
        class: "bg-primary text-secondary-foreground",
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
          "hover:bg-base-muted border-base-muted text-foreground !ring-base",
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
          "bg-base-muted text-base-muted-foreground hover:bg-base-muted-hover hover:text-base-muted-hover-foreground !ring-base-muted-hover",
      },
      {
        color: "primary",
        variant: "tonal",
        class:
          "bg-primary-muted text-primary-muted-foreground hover:bg-primary-muted-hover hover:text-primary-muted-hover-foreground !ring-primary-muted-hover",
      },
      {
        color: "secondary",
        variant: "tonal",
        class:
          "bg-secondary-muted text-secondary-muted-foreground hover:bg-secondary-muted-hover hover:text-secondary-muted-hover-foreground !ring-secondary-muted-hover",
      },
      {
        color: "accent",
        variant: "tonal",
        class:
          "bg-accent-muted text-accent-muted-foreground hover:bg-accent-muted-hover hover:text-accent-muted-hover-foreground !ring-accent-muted-hover",
      },
      {
        color: "promotion",
        variant: "tonal",
        class:
          "bg-promotion-muted text-promotion-muted-foreground hover:bg-promotion-muted-hover hover:text-promotion-muted-hover-foreground !ring-promotion-muted-hover",
      },
      {
        color: "destructive",
        variant: "tonal",
        class:
          "bg-destructive-muted text-destructive-muted-foreground hover:bg-destructive-muted-hover hover:text-destructive-muted-hover-foreground !ring-destructive-muted-hover",
      },
      {
        color: "success",
        variant: "tonal",
        class:
          "bg-success-muted text-success-muted-foreground hover:bg-success-muted-hover hover:text-success-muted-hover-foreground !ring-success-muted-hover",
      },
      {
        color: "info",
        variant: "tonal",
        class:
          "bg-info-muted text-info-muted-foreground hover:bg-info-muted-hover hover:text-info-muted-hover-foreground !ring-info-muted-hover",
      },
      {
        color: "error",
        variant: "tonal",
        class:
          "bg-error-muted text-error-muted-foreground hover:bg-error-muted-hover hover:text-error-muted-hover-foreground !ring-error-muted-hover",
      },
      {
        color: "warning",
        variant: "tonal",
        class:
          "bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted-hover hover:text-warning-muted-hover-foreground !ring-warning-muted-hover",
      },

      // --- ghost
      {
        color: "base",
        variant: "ghost",
        class: "hover:bg-base-muted ring-base-muted-hover text-base-foreground",
      },
      {
        color: "primary",
        variant: "ghost",
        class: "hover:bg-primary-muted !ring-primary-muted-hover text-primary",
      },
      {
        color: "secondary",
        variant: "ghost",
        class:
          "hover:bg-secondary-muted !ring-secondary-muted-hover text-secondary",
      },
      {
        color: "accent",
        variant: "ghost",
        class: "hover:bg-accent-muted !ring-accent-muted-hover text-accent",
      },
      {
        color: "promotion",
        variant: "ghost",
        class:
          "hover:bg-promotion-muted !ring-promotion-muted-hover text-promotion",
      },
      {
        color: "destructive",
        variant: "ghost",
        class:
          "hover:bg-destructive-muted !ring-destructive-muted-hover text-destructive",
      },

      {
        color: "success",
        variant: "ghost",
        class: "hover:bg-success-muted !ring-success-muted-hover text-success",
      },
      {
        color: "info",
        variant: "ghost",
        class: "hover:bg-info-muted !ring-info-muted-hover text-info",
      },
      {
        color: "error",
        variant: "ghost",
        class: "hover:bg-error-muted !ring-error-muted-hover text-error",
      },
      {
        color: "warning",
        variant: "ghost",
        class: "hover:bg-warning-muted !ring-warning-muted-hover text-warning",
      },

      // --- link
      {
        color: "base",
        variant: "link",
        class: "bg-transparent text-foreground !ring-transparent",
      },
      {
        color: "primary",
        variant: "link",
        class: "bg-transparent text-primary !ring-transparent",
      },
      {
        color: "secondary",
        variant: "link",
        class: "bg-transparent text-secondary !ring-transparent",
      },
      {
        color: "accent",
        variant: "link",
        class: "bg-transparent text-accent !ring-transparent",
      },
      {
        color: "promotion",
        variant: "link",
        class: "bg-transparent text-promotion !ring-transparent",
      },
      {
        color: "destructive",
        variant: "link",
        class: "bg-transparent text-destructive !ring-transparent",
      },
      {
        color: "success",
        variant: "link",
        class: "bg-transparent text-success !ring-transparent",
      },
      {
        color: "info",
        variant: "link",
        class: "bg-transparent text-info !ring-transparent",
      },
      {
        color: "error",
        variant: "link",
        class: "bg-transparent text-error !ring-transparent",
      },
      {
        color: "warning",
        variant: "link",
        class: "bg-transparent text-warning !ring-transparent",
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
