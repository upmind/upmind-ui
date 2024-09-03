import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const button = cva("justify-between", {
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
});

export const content = cva(
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 mt-1 w-72 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none",
  {
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
  }
);

export const item = cva("p-1 px-2 text-sm", {
  variants: {
    color: {
      base: "data-[highlighted]:bg-base-foreground data-[highlighted]:bg-opacity-5 data-[highlighted]:text-base-foreground",
      primary:
        "data-[highlighted]:bg-primary-background data-[highlighted]:text-primary-foreground",
      secondary:
        "data-[highlighted]:bg-secondary-background data-[highlighted]:text-secondary-foreground",
      accent:
        "data-[highlighted]:bg-accent-background data-[highlighted]:text-accent-foreground",
      promotion:
        "data-[highlighted]:bg-promotion-background data-[highlighted]:text-promotion-foreground",
      destructive:
        "data-[highlighted]:bg-destructive-background data-[highlighted]:text-destructive-foreground",
      success:
        "data-[highlighted]:bg-success-background data-[highlighted]:text-success-foreground",
      info: "data-[highlighted]:bg-info-background data-[highlighted]:text-info-foreground",
      error:
        "data-[highlighted]:bg-error-background data-[highlighted]:text-error-foreground",
      warning:
        "data-[highlighted]:bg-warning-background data-[highlighted]:text-warning-foreground",
    },
  },
});

export const icons = {
  buttonItem: cva("mr-2 size-[1.2em] overflow-hidden rounded-full"),
  listItem: cva("mr-2 size-[1em] overflow-hidden rounded-full"),
  checkItem: cva("ml-auto h-4 w-4"),
  arrowUpDown: cva("ml-2 h-3 w-3 shrink-0 opacity-50"),
};

export const root = cva(
  "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
);

export const command = {
  root: cva(
    "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
  ),
  icon: cva("mr-1 h-3 w-3"),
  wrapper: cva("flex h-9 items-center border-b px-3"),
};

export const list = cva("max-h-[18rem] overflow-y-auto overflow-x-hidden");

export const empty = cva("py-6 text-center text-sm");

export const group = cva(
  "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
);

export const label = cva(
  "px-2 py-1.5 text-xs font-medium text-muted-foreground"
);

export const commandItem = cva(
  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
);

export const separator = cva("bg-border -mx-1 h-px");

export const shortcut = cva(
  "ml-auto text-xs tracking-widest text-muted-foreground"
);
// -----------------------------------------------------------------------------

export default {
  combobox: {
    button,
    content,
    item,
    icons,
    root,
    command,
    list,
    empty,
    group,
    label,
    commandItem,
    separator,
    shortcut,
  },
};
