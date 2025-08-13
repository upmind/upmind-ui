// ---  external
import { cva } from "class-variance-authority";
import { invalidRingClasses, ringClasses } from "../../assets/ring.styles";
// -----------------------------------------------------------------------------

export const buttonVariants = cva(
  `ring-offset-background relative inline-flex items-center justify-center rounded-lg border font-medium whitespace-nowrap no-underline transition-all duration-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50!`,
  {
    variants: {
      variant: {
        flat: "hover:bg-opacity-90 border-transparent",
        outline: "bg-transparent",
        ghost: "border-transparent",
        link: "!hover:underline hover:text-opacity-60 border-none bg-transparent! px-0! underline-offset-4!",
        tonal: "border-transparent",
        inverse: "border-transparent",
        control:
          "hover:!border-control-strong !border-control bg-control !text-control-foreground ring-offset-background shadow-2xs"
      },
      focusable: {
        true: `${ringClasses} ${invalidRingClasses}`,
        false: "outline-hidden focus:ring-0 focus:outline-hidden"
      },
      color: {
        base: "",
        primary: "",
        secondary: "",
        accent: "",
        promotion: "",
        destructive: "",
        success: "!",
        info: "",
        error: "",
        warning: ""
      },
      size: {
        xs: "h-7 gap-1 px-2 py-1 text-xs",
        sm: "h-9 gap-2 px-3 py-1 text-sm",
        md: "text-md h-10 gap-2 px-4 py-1",
        lg: "h-11 gap-2 px-8 py-1 text-lg",
        xl: "h-14 gap-2 px-8 py-1 text-lg",
        icon: "h-10 w-10 gap-2 px-2 py-1",
        badge: "gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      },
      block: {
        true: "w-full basis-full"
      },
      loading: {
        true: "pointer-events-none [&>:not(.spinner)]:opacity-50"
      }
    },

    compoundVariants: [
      //  --- flat
      {
        color: "base",
        variant: "flat",
        class: "bg-base-foreground text-base-background"
      },
      {
        color: "primary",
        variant: "flat",
        class: "bg-primary text-primary-foreground !ring-primary"
      },
      {
        color: "secondary",
        variant: "flat",
        class: "bg-secondary text-secondary-foreground !ring-secondary"
      },
      {
        color: "accent",
        variant: "flat",
        class: "bg-accent text-accent-foreground !ring-accent"
      },
      {
        color: "promotion",
        variant: "flat",
        class: "bg-promotion text-promotion-foreground !ring-promotion"
      },
      {
        color: "destructive",
        variant: "flat",
        class: "bg-destructive text-destructive-foreground !ring-destructive"
      },
      {
        color: "success",
        variant: "flat",
        class: "bg-success text-success-foreground !ring-success"
      },
      {
        color: "info",
        variant: "flat",
        class: "bg-info text-info-foreground !ring-info"
      },
      {
        color: "error",
        variant: "flat",
        class: "bg-error text-error-foreground !ring-error"
      },
      {
        color: "warning",
        variant: "flat",
        class: "bg-warning text-warning-foreground !ring-warning"
      },

      // --- outline
      {
        color: "base",
        variant: "outline-solid",
        class:
          "border-base-control text-base-foreground hover:text-base-foreground/75"
      },
      {
        color: "primary",
        variant: "outline-solid",
        class:
          "hover:bg-primary-muted border-primary text-primary !ring-primary"
      },
      {
        color: "secondary",
        variant: "outline-solid",
        class:
          "hover:bg-secondary-muted border-secondary text-secondary !ring-secondary"
      },
      {
        color: "accent",
        variant: "outline-solid",
        class: "hover:bg-accent-muted border-accent text-accent !ring-accent"
      },
      {
        color: "promotion",
        variant: "outline-solid",
        class:
          "hover:bg-promotion-muted border-promotion text-promotion !ring-promotion"
      },
      {
        color: "destructive",
        variant: "outline-solid",
        class:
          "hover:bg-destructive-muted border-destructive text-destructive !ring-destructive"
      },
      {
        color: "success",
        variant: "outline-solid",
        class:
          "hover:bg-success-muted border-success text-success !ring-success"
      },
      {
        color: "info",
        variant: "outline-solid",
        class: "hover:bg-info-muted border-info text-info !ring-info"
      },
      {
        color: "error",
        variant: "outline-solid",
        class: "hover:bg-error-muted border-error text-error !ring-error"
      },
      {
        color: "warning",
        variant: "outline-solid",
        class:
          "hover:bg-warning-muted border-warning text-warning !ring-warning"
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

      // --- link
      {
        color: "base",
        variant: "link",
        class: "text-base-foreground bg-transparent ring-transparent!"
      },
      {
        color: "primary",
        variant: "link",
        class: "text-primary bg-transparent ring-transparent!"
      },
      {
        color: "secondary",
        variant: "link",
        class: "text-secondary bg-transparent ring-transparent!"
      },
      {
        color: "accent",
        variant: "link",
        class: "text-accent bg-transparent ring-transparent!"
      },
      {
        color: "promotion",
        variant: "link",
        class: "text-promotion bg-transparent ring-transparent!"
      },
      {
        color: "destructive",
        variant: "link",
        class: "text-destructive bg-transparent ring-transparent!"
      },
      {
        color: "success",
        variant: "link",
        class: "text-success bg-transparent ring-transparent!"
      },
      {
        color: "info",
        variant: "link",
        class: "text-info bg-transparent ring-transparent!"
      },
      {
        color: "error",
        variant: "link",
        class: "text-error bg-transparent ring-transparent!"
      },
      {
        color: "warning",
        variant: "link",
        class: "text-warning bg-transparent ring-transparent!"
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

      // ... existing compound variants ...
    ],

    defaultVariants: {
      block: false,
      variant: "flat",
      color: "base",
      size: "md",
      loading: false
    }
  }
);

// -----------------------------------------------------------------------------
export default {
  button: buttonVariants
};
