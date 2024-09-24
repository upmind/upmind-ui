import { cva } from "class-variance-authority";

export const tabsListVariants = cva(
  "inline-flex h-10 items-center rounded-lg p-1 text-muted-foreground",
  {
    variants: {
      variant: {
        flat: "px-0",
        outline: "border-2 bg-transparent",
        tonal: "bg-opacity-10",
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
        promotion: "",
      },
      alignment: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      },
      width: {
        full: "w-full",
        auto: "w-auto",
      },
    },
    compoundVariants: [
      {
        variant: "flat",
        color: "base",
        class: "bg-base-100",
      },
      {
        variant: "flat",
        color: "primary",
        class: "text-primary-content bg-primary",
      },
      {
        variant: "flat",
        color: "secondary",
        class: "text-secondary-content bg-secondary",
      },
      {
        variant: "flat",
        color: "accent",
        class: "text-accent-content bg-accent",
      },
      {
        variant: "flat",
        color: "success",
        class: "text-success-content bg-success",
      },
      {
        variant: "flat",
        color: "error",
        class: "text-error-content bg-error",
      },
      {
        variant: "flat",
        color: "warning",
        class: "text-warning-content bg-warning",
      },
      {
        variant: "flat",
        color: "info",
        class: "text-info-content bg-info",
      },
      {
        variant: "flat",
        color: "promotion",
        class: "text-promotion-content bg-promotion",
      },

      {
        variant: "outline",
        color: "base",
        class: "text-base-content border-base-300",
      },
      {
        variant: "outline",
        color: "primary",
        class: "border-primary text-primary",
      },
      {
        variant: "outline",
        color: "secondary",
        class: "border-secondary text-secondary",
      },
      {
        variant: "outline",
        color: "accent",
        class: "border-accent text-accent",
      },
      {
        variant: "outline",
        color: "success",
        class: "border-success text-success",
      },
      {
        variant: "outline",
        color: "error",
        class: " border-error text-error",
      },
      {
        variant: "outline",
        color: "warning",
        class: "border-warning text-warning",
      },
      {
        variant: "outline",
        color: "info",
        class: "border-info text-info",
      },
      {
        variant: "outline",
        color: "promotion",
        class: "border-promotion text-promotion",
      },

      {
        variant: "tonal",
        color: "base",
        class: "text-base-content bg-base-400",
      },
      {
        variant: "tonal",
        color: "primary",
        class: "text-primary-content bg-primary",
      },
      {
        variant: "tonal",
        color: "secondary",
        class: "text-secondary-content bg-secondary",
      },
      {
        variant: "tonal",
        color: "accent",
        class: "text-accent-content bg-accent",
      },
      {
        variant: "tonal",
        color: "success",
        class: "text-success-content bg-success",
      },
      {
        variant: "tonal",
        color: "error",
        class: "text-error-content bg-error",
      },
      {
        variant: "tonal",
        color: "warning",
        class: "text-warning-content bg-warning",
      },
      {
        variant: "tonal",
        color: "info",
        class: "text-info-content bg-info",
      },
      {
        variant: "tonal",
        color: "promotion",
        class: "text-promotion-content bg-promotion",
      },
    ],
    defaultVariants: {
      variant: "flat",
      color: "base",
      alignment: "evenly",
      width: "auto",
    },
  }
);

export const tabsTriggerVariants = cva(
  "focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        flat: "mx-1 w-full data-[state=active]:bg-background",
        outline:
          "text-opacity-50 hover:text-opacity-100 data-[state=active]:text-opacity-100",
        tonal: "",
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
        promotion: "",
      },
    },
    compoundVariants: [
      {
        variant: "flat",
        color: "base",
        class: "text-base-600 data-[state=active]:text-base-800",
      },
      {
        variant: "flat",
        color: "primary",
        class: "text-primary-content data-[state=active]:text-primary",
      },
      {
        variant: "flat",
        color: "secondary",
        class: "text-secondary-content data-[state=active]:text-secondary",
      },
      {
        variant: "flat",
        color: "accent",
        class: "text-accent-content data-[state=active]:text-accent",
      },
      {
        variant: "flat",
        color: "success",
        class: "text-success-content data-[state=active]:text-success",
      },
      {
        variant: "flat",
        color: "error",
        class: "text-error-content data-[state=active]:text-error",
      },
      {
        variant: "flat",
        color: "warning",
        class: "text-warning-content data-[state=active]:text-warning",
      },
      {
        variant: "flat",
        color: "info",
        class: "text-info-content data-[state=active]:text-info",
      },
      {
        variant: "flat",
        color: "promotion",
        class: "text-promotion-content data-[state=active]:text-promotion",
      },

      {
        variant: "outline",
        color: "base",
        class: "text-base-800",
      },
      {
        variant: "outline",
        color: "primary",
        class: "text-primary",
      },
      {
        variant: "outline",
        color: "secondary",
        class: "text-secondary",
      },
      {
        variant: "outline",
        color: "accent",
        class: "text-accent",
      },
      {
        variant: "outline",
        color: "success",
        class: "text-success",
      },
      {
        variant: "outline",
        color: "error",
        class: "text-error",
      },
      {
        variant: "outline",
        color: "warning",
        class: "text-warning",
      },
      {
        variant: "outline",
        color: "info",
        class: "text-info",
      },
      {
        variant: "outline",
        color: "promotion",
        class: "text-promotion",
      },
      {
        variant: "tonal",
        class:
          "text-opacity-50 hover:text-opacity-100 data-[state=active]:text-opacity-100",
      },
      {
        variant: "tonal",
        color: "base",
        class: "text-base-800",
      },
      {
        variant: "tonal",
        color: "primary",
        class: "text-primary",
      },
      {
        variant: "tonal",
        color: "secondary",
        class: "text-secondary",
      },
      {
        variant: "tonal",
        color: "accent",
        class: "text-accent",
      },
      {
        variant: "tonal",
        color: "success",
        class: "text-success",
      },
      {
        variant: "tonal",
        color: "error",
        class: "text-error",
      },
      {
        variant: "tonal",
        color: "warning",
        class: "text-warning",
      },
      {
        variant: "tonal",
        color: "info",
        class: "text-info",
      },
      {
        variant: "tonal",
        color: "promotion",
        class: "text-promotion",
      },
    ],
    defaultVariants: {
      variant: "flat",
      color: "base",
    },
  }
);

export default {
  tabs: {
    list: tabsListVariants,
    trigger: tabsTriggerVariants,
  },
};
