import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  group: {
    root: cva("flex flex-col gap-4 border-t border-base-100 pt-4"),
    label: cva("w-full text-xs font-medium text-base-500"),
    item: cva(""),
  },
  layout: {
    root: cva("flex w-full gap-2", {
      variants: {
        isHorizontal: {
          true: "flex-row flex-wrap",
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
