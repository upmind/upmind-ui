import { cva } from "class-variance-authority";

export const contentVariants = cva(
  "z-50 mt-1 w-72 rounded-lg border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      width: {
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
        full: "w-full",
      },
    },
    defaultVariants: {
      width: "md",
    },
  }
);

export const itemVariants = cva(
  "flex w-full !cursor-pointer items-center bg-base-background px-3 py-2 text-sm text-base-foreground",
  {
    variants: {
      color: {
        base: "data-[highlighted]:bg-base-muted data-[highlighted]:text-base-muted-foreground",
        primary:
          "data-[highlighted]:bg-primary-muted data-[highlighted]:text-primary-muted-foreground",
        secondary:
          "data-[highlighted]:bg-secondary-muted data-[highlighted]:text-secondary-muted-foreground",
        accent:
          "data-[highlighted]:bg-accent-muted data-[highlighted]:text-accent-muted-foreground",
        promotion:
          "data-[highlighted]:bg-promotion-muted data-[highlighted]:text-promotion-muted-foreground",
        destructive:
          "data-[highlighted]:bg-destructive-muted data-[highlighted]:text-destructive-muted-foreground",
        success:
          "data-[highlighted]:bg-success-muted data-[highlighted]:text-success-muted-foreground",
        info: "data-[highlighted]:bg-info-muted data-[highlighted]:text-info-muted-foreground",
        error:
          "data-[highlighted]:bg-error-muted data-[highlighted]:text-error-muted-foreground",
        warning:
          "data-[highlighted]:bg-warning-muted data-[highlighted]:text-warning-muted-foreground",
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
