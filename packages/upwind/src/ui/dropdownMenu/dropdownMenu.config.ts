import { cva } from "class-variance-authority";

export const contentVariants = cva(
  "z-50 mt-1 w-72 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      size: {
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
      },
    },
  }
);

export const itemVariants = cva(
  "flex w-full !cursor-pointer items-center bg-base px-3 py-2 text-sm text-base-foreground",
  {
    variants: {
      color: {
        base: "data-[highlighted]:bg-base-50 data-[highlighted]:text-base-foreground",
        primary:
          "data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary",
        secondary:
          "data-[highlighted]:bg-secondary-50 data-[highlighted]:text-secondary",
        accent:
          "data-[highlighted]:bg-accent-50 data-[highlighted]:text-accent",
        promotion:
          "data-[highlighted]:bg-promotion-50 data-[highlighted]:text-promotion",
        destructive:
          "data-[highlighted]:bg-destructive-50 data-[highlighted]:text-destructive",
        success:
          "data-[highlighted]:bg-success-50 data-[highlighted]:text-success",
        info: "data-[highlighted]:bg-info-50 data-[highlighted]:text-info",
        error: "data-[highlighted]:bg-error-50 data-[highlighted]:text-error",
        warning:
          "data-[highlighted]:bg-warning-50 data-[highlighted]:text-warning",
      },
    },
    defaultVariants: {
      color: "base",
    },
  }
);

export default {
  dropdownMenu: {
    content: contentVariants,
    item: itemVariants,
  },
};
