import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  group: {
    root: cva(""),
    label: cva("divider"),
    item: cva(""),
  },
  layout: {
    root: cva("flex w-full gap-2", {
      variants: {
        isHorizontal: {
          true: "flex-row flex-wrap gap-x-10",
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
