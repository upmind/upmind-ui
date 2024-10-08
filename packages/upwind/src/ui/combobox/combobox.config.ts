import { cva } from "class-variance-authority";

export const buttonVariants = cva("justify-between", {
  variants: {
    color: {
      base: "border-opacity-10 hover:border-opacity-10",
    },
    width: {
      "2xs": "w-dropdown-2xs",
      xs: "w-dropdown-xs",
      sm: "w-dropdown-sm",
      md: "w-dropdown-md",
      lg: "w-dropdown-lg",
      xl: "w-dropdown-xl",
      "2xl": "w-dropdown-2xl",
      full: "w-full",
    },
  },
});

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
      },
    },
  }
);

export const itemVariants = cva("flex w-full items-center p-2 px-3 text-sm", {
  variants: {
    color: {
      base: "!data-[highlighted]:bg-base !data-[highlighted]:bg-opacity-5 !data-[highlighted]:text-primary text-primary",
      primary:
        "!data-[highlighted]:bg-primary-background !data-[highlighted]:text-primary-foreground",
      secondary:
        "!data-[highlighted]:bg-secondary-background !data-[highlighted]:text-secondary-foreground",
      accent:
        "!data-[highlighted]:bg-accent-background !data-[highlighted]:text-accent-foreground",
      promotion:
        "!data-[highlighted]:bg-promotion-background !data-[highlighted]:text-promotion-foreground",
      destructive:
        "!data-[highlighted]:bg-destructive-background !data-[highlighted]:text-destructive-foreground",
      success:
        "!data-[highlighted]:bg-success-background !data-[highlighted]:text-success-foreground",
      info: "!data-[highlighted]:bg-info-background !data-[highlighted]:text-info-foreground",
      error:
        "!data-[highlighted]:bg-error-background !data-[highlighted]:text-error-foreground",
      warning:
        "!data-[highlighted]:bg-warning-background !data-[highlighted]:text-warning-foreground",
    },
  },
});

export default {
  combobox: {
    button: buttonVariants,
    content: contentVariants,
    item: itemVariants,
  },
};
