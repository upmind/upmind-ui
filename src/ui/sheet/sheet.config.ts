import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const sheetVariants = cva(
  "bg-surface data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 gap-4 p-6 shadow-lg transition duration-500 ease-in-out data-[state=closed]:duration-300",
  {
    variants: {
      side: {
        top: "border-surface data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 border-b",
        bottom:
          "border-surface data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 border-t",
        left: "border-surface data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right:
          "border-surface data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);

// -----------------------------------------------------------------------------
// The registry pieces carry the geometry; these are `uiConfig`'s per-instance
// override channel, bar the container's own column between header and footer.
export default {
  sheet: {
    overlay: cva(""),
    content: cva(""),
    header: cva(""),
    container: cva("flex min-h-0 w-full flex-1 flex-col"),
    footer: cva("")
  }
};
