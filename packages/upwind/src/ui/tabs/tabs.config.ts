import { cva } from "class-variance-authority";

export const listConfig = cva(
  "text-muted-foreground inline-flex h-10 items-center rounded-lg p-1",
  {
    variants: {
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
        class: "px-0",
      },
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
        class: "border-2 bg-transparent",
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
        class: "bg-opacity-10",
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

export const triggerConfig = cva(
  "focus-visible:ring-ring ring-offset-background inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // Compound variants do not work without this defined
    },
    compoundVariants: [
      {
        variant: "flat",
        class: "data-[state=active]:bg-background mx-1 w-full",
      },
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
        class:
          "text-opacity-50 hover:text-opacity-100 data-[state=active]:text-opacity-100",
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

export const contentConfig = cva(
  "focus-visible:ring-ring ring-offset-background mt-2 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
);

export const iconConfig = cva("mr-2 h-4 w-4");

export default {
  tabs: {
    list: listConfig,
    trigger: triggerConfig,
    content: contentConfig,
    icon: iconConfig,
  },
};
