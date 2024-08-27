import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const comboboxConfig = {
  button: cva("justify-between", {
    variants: {
      width: {
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
      },
    },
  }),
  content: cva("mt-1 p-0", {
    variants: {
      width: {
        xs: "w-dropdown-xs",
        sm: "w-dropdown-sm",
        md: "w-dropdown-md",
        lg: "w-dropdown-lg",
        xl: "w-dropdown-xl",
        "2xl": "w-dropdown-2xl",
      },
    },
  }),
  item: cva("", {
    variants: {
      color: {
        base: "data-[highlighted]:bg-base-foreground data-[highlighted]:text-base-foreground data-[highlighted]:bg-opacity-5",
        primary:
          "data-[highlighted]:bg-primary-background data-[highlighted]:text-primary-foreground",
        secondary:
          "data-[highlighted]:bg-secondary-background data-[highlighted]:text-secondary-foreground",
        accent:
          "data-[highlighted]:bg-accent-background data-[highlighted]:text-accent-foreground",
        success:
          "data-[highlighted]:bg-success-background data-[highlighted]:text-success-foreground",
        error:
          "data-[highlighted]:bg-error-background data-[highlighted]:text-error-foreground",
        warning:
          "data-[highlighted]:bg-warning-background data-[highlighted]:text-warning-foreground",
        info: "data-[highlighted]:bg-info-background data-[highlighted]:text-info-foreground",
        promotion:
          "data-[highlighted]:bg-promotion-background data-[highlighted]:text-promotion-foreground",
      },
    },
  }),
  input: cva("h-9"),
  icons: {
    buttonItem: cva("mr-2 size-[1.2em] overflow-hidden rounded-full"),
    listItem: cva("mr-2 size-[1em] overflow-hidden rounded-full"),
    checkItem: cva("ml-auto h-4 w-4"),
    arrowUpDown: cva("ml-2 h-3 w-3 shrink-0 opacity-50"),
  },
};

export default {
  combobox: comboboxConfig,
};
