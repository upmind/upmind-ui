import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  section: {
    header: cva("border-surface border-b pb-4", {
      variants: {
        variant: {
          enclosed: "border-b-0"
        }
      }
    }),
    root: cva("flex w-full flex-col gap-9", {
      variants: {
        variant: {
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
