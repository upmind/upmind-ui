import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  section: {
    header: cva("flex justify-between", {
      variants: {
        variant: {
          full: "border-surface border-b pb-4",
          default: "border-surface border-b pb-4",
          twoColumnLTR: "border-surface border-b pb-4",
          twoColumnRTL: "border-surface border-b pb-4",
          enclosed: ""
        }
      }
    }),
    root: cva("flex w-full flex-col", {
      variants: {
        variant: {
          default: "gap-9",
          full: "gap-9",
          enclosed: "gap-3"
        }
      }
    }),
    content: cva("flex w-full flex-col gap-8"),
    title: {
      root: cva("flex items-center gap-2"),
      heading: cva("text-md/tight text-base font-medium")
    }
  }
};
