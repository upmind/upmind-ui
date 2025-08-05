// ---  external
import { cva } from "class-variance-authority";
import { invalidRingClasses, ringClasses } from "../../assets/styles";
// -----------------------------------------------------------------------------

export const rootVariants = cva(
  `disabled:text-emphasis-medium relative inline-flex items-center justify-center whitespace-nowrap font-medium no-underline ring-offset-background transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed`,
  {
    variants: {
      size: {
        sm: "px-0.5 py-2 text-sm",
        md: "gap-0.5 px-3 py-2 text-sm",
        lg: "gap-0.5 px-4 py-2 text-md",
        icon: "h-10 w-10 gap-2 px-2 py-1",
        badge: "gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      },
      variant: {
        flat: "hover:bg-opacity-90",
        outline: "shadow-border",
        ghost: "",
        link: "gap-1 !bg-transparent !p-0 underline underline-offset-4",
        tonal: "",
        inverse: "",
        control:
          "border bg-control !text-control-foreground ring-offset-background"
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
        warning: "!ring-warning"
      },
      isFocusable: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false: "outline-none focus:outline-none focus:ring-0"
      },
      isBlock: {
        true: "w-full basis-full"
      },
      isLoading: {
        true: "pointer-events-none [&>:not(.spinner)]:opacity-50"
      },
      isPill: {
        true: "rounded-pill",
        false: "rounded"
      }
    },
    compoundVariants: [
      //  --- flat
      {
        color: "base",
        variant: "flat",
        class: "bg-base-foreground text-base-background !ring-base"
      },
      {
        color: "primary",
        variant: "flat",
        class: "bg-primary text-primary-foreground"
      },
      {
        color: "secondary",
        variant: "flat",
        class: "bg-secondary text-secondary-foreground"
      },
      {
        color: "accent",
        variant: "flat",
        class: "bg-accent text-accent-foreground"
      },
      {
        color: "promotion",
        variant: "flat",
        class: "bg-promotion text-promotion-foreground"
      },
      {
        color: "destructive",
        variant: "flat",
        class: "bg-destructive text-destructive-foreground"
      },
      {
        color: "success",
        variant: "flat",
        class: "bg-success text-success-foreground"
      },
      { color: "info", variant: "flat", class: "bg-info text-info-foreground" },
      {
        color: "error",
        variant: "flat",
        class: "bg-error text-error-foreground"
      },
      {
        color: "warning",
        variant: "flat",
        class: "bg-warning text-warning-foreground"
      },

      // --- outline
      {
        color: "base",
        variant: "outline",
        class: "text-base-foreground hover:text-base-foreground/75"
      },
      {
        color: "primary",
        variant: "outline",
        class: "hover:bg-primary-muted text-primary"
      },
      {
        color: "secondary",
        variant: "outline",
        class: "hover:bg-secondary-muted text-secondary"
      },
      {
        color: "accent",
        variant: "outline",
        class: "hover:bg-accent-muted text-accent"
      },
      {
        color: "promotion",
        variant: "outline",
        class: "hover:bg-promotion-muted text-promotion"
      },
      {
        color: "destructive",
        variant: "outline",
        class: "hover:bg-destructive-muted text-destructive"
      },
      {
        color: "success",
        variant: "outline",
        class: "hover:bg-success-muted text-success"
      },
      {
        color: "info",
        variant: "outline",
        class: "hover:bg-info-muted text-info"
      },
      {
        color: "error",
        variant: "outline",
        class: "hover:bg-error-muted text-error"
      },
      {
        color: "warning",
        variant: "outline",
        class: "hover:bg-warning-muted text-warning"
      },

      // --- tonal
      {
        color: "base",
        variant: "tonal",
        class:
          "bg-base-muted hover:bg-base-muted-active text-base-muted-foreground !ring-base-muted-active"
      },
      {
        color: "primary",
        variant: "tonal",
        class:
          "bg-primary-muted hover:bg-primary-muted-active text-primary-muted-foreground !ring-primary-muted-active"
      },
      {
        color: "secondary",
        variant: "tonal",
        class:
          "bg-secondary-muted hover:bg-secondary-muted-active text-secondary-muted-foreground !ring-secondary-muted-active"
      },
      {
        color: "accent",
        variant: "tonal",
        class:
          "bg-accent-muted hover:bg-accent-muted-active text-accent-muted-foreground !ring-accent-muted-active"
      },
      {
        color: "promotion",
        variant: "tonal",
        class:
          "bg-promotion-muted hover:bg-promotion-muted-active text-promotion-muted-foreground !ring-promotion-muted-active"
      },
      {
        color: "destructive",
        variant: "tonal",
        class:
          "bg-destructive-muted hover:bg-destructive-muted-active text-destructive-muted-foreground !ring-destructive-muted-active"
      },
      {
        color: "success",
        variant: "tonal",
        class:
          "bg-success-muted hover:bg-success-muted-active text-success-muted-foreground !ring-success-muted-active"
      },
      {
        color: "info",
        variant: "tonal",
        class:
          "bg-info-muted hover:bg-info-muted-active text-info-muted-foreground !ring-info-muted-active"
      },
      {
        color: "error",
        variant: "tonal",
        class:
          "bg-error-muted hover:bg-error-muted-active text-error-muted-foreground !ring-error-muted-active"
      },
      {
        color: "warning",
        variant: "tonal",
        class:
          "bg-warning-muted hover:bg-warning-muted-active text-warning-muted-foreground !ring-warning-muted-active"
      },

      // --- ghost
      {
        color: "base",
        variant: "ghost",
        class:
          "ring-base-muted-active text-base-foreground hover:text-base-foreground/75"
      },
      {
        color: "primary",
        variant: "ghost",
        class: "hover:bg-primary-muted !ring-primary-muted-active text-primary"
      },
      {
        color: "secondary",
        variant: "ghost",
        class:
          "hover:bg-secondary-muted !ring-secondary-muted-active text-secondary"
      },
      {
        color: "accent",
        variant: "ghost",
        class: "hover:bg-accent-muted !ring-accent-muted-active text-accent"
      },
      {
        color: "promotion",
        variant: "ghost",
        class:
          "hover:bg-promotion-muted !ring-promotion-muted-active text-promotion"
      },
      {
        color: "destructive",
        variant: "ghost",
        class:
          "hover:bg-destructive-muted !ring-destructive-muted-active text-destructive"
      },

      {
        color: "success",
        variant: "ghost",
        class: "hover:bg-success-muted !ring-success-muted-active text-success"
      },
      {
        color: "info",
        variant: "ghost",
        class: "hover:bg-info-muted !ring-info-muted-active text-info"
      },
      {
        color: "error",
        variant: "ghost",
        class: "hover:bg-error-muted !ring-error-muted-active text-error"
      },
      {
        color: "warning",
        variant: "ghost",
        class: "hover:bg-warning-muted !ring-warning-muted-active text-warning"
      },

      // --- link (simplified - just inherit text color)
      {
        variant: "link",
        class: "text-current"
      },

      // --- inverse
      {
        color: "base",
        variant: "inverse",
        class:
          "hover:bg-base-muted-active bg-base-background text-base-foreground"
      },
      {
        color: "primary",
        variant: "inverse",
        class: "hover:bg-primary-muted bg-primary-foreground text-primary"
      },
      {
        color: "secondary",
        variant: "inverse",
        class: "hover:bg-secondary-muted bg-secondary-foreground text-secondary"
      },
      {
        color: "accent",
        variant: "inverse",
        class: "hover:bg-accent-muted bg-accent-foreground text-accent"
      },
      {
        color: "promotion",
        variant: "inverse",
        class: "hover:bg-promotion-muted bg-promotion-foreground text-promotion"
      },
      {
        color: "destructive",
        variant: "inverse",
        class:
          "hover:bg-destructive-muted bg-destructive-foreground text-destructive"
      },
      {
        color: "success",
        variant: "inverse",
        class: "hover:bg-success-muted bg-success-foreground text-success"
      },
      {
        color: "info",
        variant: "inverse",
        class: "hover:bg-info-muted bg-info-foreground text-info"
      },
      {
        color: "error",
        variant: "inverse",
        class: "hover:bg-error-muted bg-error-foreground text-error"
      },
      {
        color: "warning",
        variant: "inverse",
        class: "hover:bg-warning-muted bg-warning-foreground text-warning"
      }
    ],

    defaultVariants: {
      variant: "flat",
      color: "base",
      size: "md",
      isFocusable: true,
      isBlock: false,
      isLoading: false,
      isPill: false
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  button: {
    root: rootVariants,
    items: cva("flex size-[1lh] items-center justify-center")
  }
};
