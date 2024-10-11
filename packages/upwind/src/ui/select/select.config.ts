import { cva } from "class-variance-authority";

export const triggerVariants = cva("", {
  variants: {
    variant: {
      flat: "border-transparent hover:bg-opacity-90",
      outline: "bg-transparent",
      ghost: "border-transparent",
      link: "!hover:underline border-none !bg-transparent !px-0 !underline-offset-4",
      tonal: "border-transparent",
      control:
        "!hover:bg-opacity-80 !border-input !bg-control !text-control-foreground shadow-sm ring-offset-background",
    },
    width: {
      full: "w-full",
    },
  },
  defaultVariants: {
    width: "full",
    variant: "control",
  },
});

export const colorVariants = cva("", {
  variants: {
    color: {
      base: "text-base hover:text-base",
      primary: "text-primary hover:text-primary",
      secondary: "text-secondary hover:text-secondary focus:text-secondary",
      accent: "text-accent hover:text-accent",
      promotion: "text-promotion hover:text-promotion",
      destructive: "text-destructive hover:text-destructive",
      success: "text-success hover:text-success",
      info: "text-info hover:text-info",
      error: "text-error hover:text-error",
      warning: "text-warning hover:text-warning",
    },
  },
  defaultVariants: {
    color: "base",
  },
});

export default {
  select: {
    color: colorVariants,
    trigger: triggerVariants,
  },
};
