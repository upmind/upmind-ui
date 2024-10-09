import { cva } from "class-variance-authority";

export const triggerVariants = cva("h-16 text-sm", {
  variants: {
    width: {
      full: "w-full",
      auto: "w-auto",
    },
  },
  defaultVariants: {
    width: "auto",
  },
});

export const contentVariants = cva("text-sm", {
  variants: {
    color: {
      base: "text-base",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      success: "text-success",
      error: "text-error",
      warning: "text-warning",
      info: "text-info",
      promotion: "text-promotion",
    },
  },
  defaultVariants: {
    color: "base",
  },
});

export default {
  radioSelect: {
    trigger: triggerVariants,
    content: contentVariants,
  },
};
