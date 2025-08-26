import { cva } from "class-variance-authority";

export const tabsListVariants = cva(
  "text-muted-foreground mb-6 inline-flex items-center rounded p-1",
  {
    variants: {
      variant: {
        flat: "px-0",
        outline: "shadow-border-control p-0",
        tonal: "bg-opacity-10"
      },
      color: {
        base: "",
        primary: "",
        secondary: "",
        accent: "",
        success: "",
        error: "",
        warning: "",
        info: "",
        promotion: ""
      },
      alignment: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly"
      },
      width: {
        full: "w-full",
        auto: "w-auto"
      }
    },
    compoundVariants: [
      {
        variant: "flat",
        color: "base",
        class: "bg-base-muted"
      },
      {
        variant: "flat",
        color: "primary",
        class: "bg-primary text-primary-foreground"
      },
      {
        variant: "flat",
        color: "secondary",
        class: "bg-secondary text-secondary-foreground"
      },
      {
        variant: "flat",
        color: "accent",
        class: "bg-accent text-accent-foreground"
      },
      {
        variant: "flat",
        color: "success",
        class: "bg-success text-success-foreground"
      },
      {
        variant: "flat",
        color: "error",
        class: "bg-error text-error-foreground"
      },
      {
        variant: "flat",
        color: "warning",
        class: "bg-warning text-warning-foreground"
      },
      {
        variant: "flat",
        color: "info",
        class: "bg-info text-info-foreground"
      },
      {
        variant: "flat",
        color: "promotion",
        class: "bg-promotion text-promotion-foreground"
      },

      {
        variant: "outline",
        color: "base",
        class: "bg-control-background text-base-foreground"
      },
      {
        variant: "outline",
        color: "primary",
        class: "border-primary text-primary"
      },
      {
        variant: "outline",
        color: "secondary",
        class: "border-secondary text-secondary"
      },
      {
        variant: "outline",
        color: "accent",
        class: "border-accent text-accent"
      },
      {
        variant: "outline",
        color: "success",
        class: "border-success text-success"
      },
      {
        variant: "outline",
        color: "error",
        class: "border-error text-error"
      },
      {
        variant: "outline",
        color: "warning",
        class: "border-warning text-warning"
      },
      {
        variant: "outline",
        color: "info",
        class: "border-info text-info"
      },
      {
        variant: "outline",
        color: "promotion",
        class: "border-promotion text-promotion"
      },

      {
        variant: "tonal",
        color: "base",
        class: "bg-base-muted text-base-foreground"
      },
      {
        variant: "tonal",
        color: "primary",
        class: "bg-primary text-primary-foreground"
      },
      {
        variant: "tonal",
        color: "secondary",
        class: "bg-secondary text-secondary-foreground"
      },
      {
        variant: "tonal",
        color: "accent",
        class: "bg-accent text-accent-foreground"
      },
      {
        variant: "tonal",
        color: "success",
        class: "bg-success text-success-foreground"
      },
      {
        variant: "tonal",
        color: "error",
        class: "bg-error text-error-foreground"
      },
      {
        variant: "tonal",
        color: "warning",
        class: "bg-warning text-warning-foreground"
      },
      {
        variant: "tonal",
        color: "info",
        class: "bg-info text-info-foreground"
      },
      {
        variant: "tonal",
        color: "promotion",
        class: "bg-promotion text-promotion-foreground"
      }
    ],

    defaultVariants: {
      variant: "outline",
      color: "base",
      alignment: "evenly",
      width: "auto"
    }
  }
);

export const tabsTriggerVariants = cva(
  "text-md relative inline-flex cursor-pointer items-center justify-center rounded px-8 py-2 font-normal whitespace-nowrap transition-all duration-300 data-[state=active]:font-medium",
  {
    variants: {
      variant: {
        flat: "mx-1 w-full data-[state=active]:bg-white",
        outline: "data-[state=active]:shadow-border-foreground",
        tonal: ""
      },
      color: {
        base: "",
        primary: "",
        secondary: "",
        accent: "",
        success: "",
        error: "",
        warning: "",
        info: "",
        promotion: ""
      }
    },
    compoundVariants: [
      {
        variant: "flat",
        color: "base",
        class: "text-emphasis-medium data-[state=active]:text-emphasis-high"
      },
      {
        variant: "flat",
        color: "primary",
        class: "text-primary-foreground data-[state=active]:text-primary"
      },
      {
        variant: "flat",
        color: "secondary",
        class: "text-secondary-foreground data-[state=active]:text-secondary"
      },
      {
        variant: "flat",
        color: "accent",
        class: "text-accent-foreground data-[state=active]:text-accent"
      },
      {
        variant: "flat",
        color: "success",
        class: "text-success-foreground data-[state=active]:text-success"
      },
      {
        variant: "flat",
        color: "error",
        class: "text-error-foreground data-[state=active]:text-error"
      },
      {
        variant: "flat",
        color: "warning",
        class: "text-warning-foreground data-[state=active]:text-warning"
      },
      {
        variant: "flat",
        color: "info",
        class: "text-info-foreground data-[state=active]:text-info"
      },
      {
        variant: "flat",
        color: "promotion",
        class: "text-promotion-foreground data-[state=active]:text-promotion"
      },

      {
        variant: "outline",
        color: "base",
        class: "text-emphasis-high"
      },
      {
        variant: "outline",
        color: "primary",
        class: "text-primary"
      },
      {
        variant: "outline",
        color: "secondary",
        class: "text-secondary"
      },
      {
        variant: "outline",
        color: "accent",
        class: "text-accent"
      },
      {
        variant: "outline",
        color: "success",
        class: "text-success"
      },
      {
        variant: "outline",
        color: "error",
        class: "text-error"
      },
      {
        variant: "outline",
        color: "warning",
        class: "text-warning"
      },
      {
        variant: "outline",
        color: "info",
        class: "text-info"
      },
      {
        variant: "outline",
        color: "promotion",
        class: "text-promotion"
      },
      {
        variant: "tonal",
        class:
          "text-opacity-50 hover:text-opacity-100 data-[state=active]:text-opacity-100"
      },
      {
        variant: "tonal",
        color: "base",
        class: "text-emphasis-high"
      },
      {
        variant: "tonal",
        color: "primary",
        class: "text-primary"
      },
      {
        variant: "tonal",
        color: "secondary",
        class: "text-secondary"
      },
      {
        variant: "tonal",
        color: "accent",
        class: "text-accent"
      },
      {
        variant: "tonal",
        color: "success",
        class: "text-success"
      },
      {
        variant: "tonal",
        color: "error",
        class: "text-error"
      },
      {
        variant: "tonal",
        color: "warning",
        class: "text-warning"
      },
      {
        variant: "tonal",
        color: "info",
        class: "text-info"
      },
      {
        variant: "tonal",
        color: "promotion",
        class: "text-promotion"
      }
    ],
    defaultVariants: {
      variant: "flat",
      color: "base"
    }
  }
);

export default {
  tabs: {
    list: tabsListVariants,
    trigger: tabsTriggerVariants
  }
};
