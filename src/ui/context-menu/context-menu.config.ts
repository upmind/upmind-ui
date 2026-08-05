import { cva } from "class-variance-authority";

// Styling mirrors dropdown-menu — same surface, sizing and spacing. Only the
// trigger mechanic (right-click vs click) differs, so the trigger-offset (mt-1)
// and trigger-width (auto) are dropped: a context menu opens at the cursor and
// has no trigger to offset from or match. Reuses the shared w-dropdown-* tokens.
export const variants = {
  width: {
    xs: "w-dropdown-xs",
    sm: "w-dropdown-sm",
    md: "w-dropdown-md",
    lg: "w-dropdown-lg",
    xl: "w-dropdown-xl",
    "2xl": "w-dropdown-2xl",
    full: "w-full",
    auto: "w-auto"
  }
};

export const contentVariants = cva(
  `bg-control-surface text-display data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-control-default control-radius z-50 w-72 border-none p-0`,
  {
    variants,
    defaultVariants: {
      width: "md"
    }
  }
);

export default {
  contextMenu: {
    content: contentVariants,
    label: cva("border-control-default border-b px-5 py-3 text-sm font-medium"),
    group: cva("p-2"),
    item: cva("[[data-highlighted]_&]:bg-button-ghost-hover font-normal")
  }
};
