import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  group: {
    root: cva("flex flex-col space-y-2", {
      variants: {
        hasBorder: {
          true: "border-t border-control pt-4"
        }
      }
    }),
    label: cva("w-full text-xs font-medium text-base-500"),
    item: cva("")
  },
  layout: {
    root: cva("flex w-full", {
      variants: {
        isHorizontal: {
          true: "flex-row flex-wrap space-x-4",
          false: "flex-col space-y-4"
        }
      }
    }),
    item: cva("w-full empty:hidden data-[visible='false']:hidden", {
      variants: {
        isHorizontal: {
          true: "flex-1",
          false: ""
        }
      }
    })
  }
};
