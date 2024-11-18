import { cva } from "class-variance-authority";
import { ringClasses, invalidRingClasses } from "../input/input.config";

export const triggerVariants = cva(
  "hover:bg-base-muted h-auto min-h-10 justify-start overflow-hidden rounded-md border-opacity-10 px-3 transition-all duration-300 hover:border-opacity-10",
  {
    variants: {
      width: {
        "2xs": "w-dropdown-2xs",
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        app: "w-app",
      },
    },
    defaultVariants: {
      width: "full",
    },
  }
);

export const itemVariants = cva(
  "flex w-full !cursor-pointer items-center bg-base px-3 py-2 text-sm text-control-foreground",
  {
    variants: {
      color: {
        base: "data-[highlighted]:bg-control-active-muted data-[highlighted]:text-control-foreground",
        primary:
          "data-[highlighted]:bg-primary-muted data-[highlighted]:text-primary",
        secondary:
          "data-[highlighted]:bg-secondary-muted data-[highlighted]:text-secondary",
        accent:
          "data-[highlighted]:bg-accent-muted data-[highlighted]:text-accent",
        promotion:
          "data-[highlighted]:bg-promotion-muted data-[highlighted]:text-promotion",
        destructive:
          "data-[highlighted]:bg-destructive-muted data-[highlighted]:text-destructive",
        success:
          "data-[highlighted]:bg-success-muted data-[highlighted]:text-success",
        info: "data-[highlighted]:bg-info-muted data-[highlighted]:text-info",
        error:
          "data-[highlighted]:bg-error-muted data-[highlighted]:text-error",
        warning:
          "data-[highlighted]:bg-warning-muted data-[highlighted]:text-warning",
      },
    },
    defaultVariants: {
      color: "base",
    },
  }
);

export const contentVariants = cva(
  "z-50 mt-1 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      width: {
        "2xs": "w-dropdown-2xs",
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
        auto: "w-auto",
        app: "w-app",
      },
    },
  }
);

export default {
  combobox: {
    root: cva(`${ringClasses} ${invalidRingClasses} w-full rounded-md`),
    trigger: triggerVariants,
    content: contentVariants,
    item: itemVariants,
  },
};
