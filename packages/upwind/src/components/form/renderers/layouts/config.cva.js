import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  group: {
    root: cva("mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 "),
    label: cva("text-base-500 w-full text-xs font-medium"),
    item: cva(""),
  },
  layout: {
    root: cva("flex w-full gap-2", {
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
