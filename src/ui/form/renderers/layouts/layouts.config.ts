import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  group: {
    root: cva("flex flex-col gap-y-2 border-t border-control pt-4"),
    label: cva("w-full text-xs font-medium text-base-500"),
    item: cva(""),
  },
  layout: {
    root: cva("flex w-full gap-y-4", {
      variants: {
        isHorizontal: {
          true: "flex-row flex-wrap gap-x-4",
          false: "flex-col",
        },
      },
    }),
    item: cva("w-full empty:hidden", {
      variants: {
        isHorizontal: {
          true: "flex-1",
          false: "w-full",
        },
      },
    }),
  },
};
