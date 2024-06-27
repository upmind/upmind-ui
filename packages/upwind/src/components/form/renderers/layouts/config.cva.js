import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  group: {
    root: cva("border-base-100 flex flex-col gap-4 border-t pt-4"),
    label: cva("text-base-500 w-full text-xs font-medium"),
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
