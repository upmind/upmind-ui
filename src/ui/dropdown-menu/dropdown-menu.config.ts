import { cva } from "class-variance-authority";

export const variants = {
  width: {
    xs: "w-dropdown-xs",
    sm: "w-dropdown-sm",
    md: "w-dropdown-md",
    lg: "w-dropdown-lg",
    xl: "w-dropdown-xl",
    "2xl": "w-dropdown-2xl",
    full: "w-full",
    auto: "w-(--radix-dropdown-menu-trigger-width)"
  }
};

export const contentVariants = cva(
  "bg-background-control-surface text-text-display data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-border-control-default z-50 mt-1 w-72 rounded border p-0 outline-hidden",
  {
    variants,
    defaultVariants: {
      width: "md"
    }
  }
);

export default {
  dropdownMenu: {
    content: contentVariants,
    label: cva(
      "border-border-control-default border-b px-5 py-3 text-sm font-medium"
    ),
    group: cva("p-2"),
    item: cva("font-normal")
  }
};
