// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  skeleton: {
    root: cva("bg-base-muted muted w-auto animate-pulse rounded"),
    content: cva("w-auto select-none opacity-0")
  },
  skeletonList: {
    root: cva(
      "divide-base-muted flex w-full animate-pulse flex-col space-y-4 divide-y rounded border p-4 md:p-6"
    ),
    rows: cva("flex items-center justify-between pt-4 first:pt-0"),
    line1: cva("bg-base-muted mb-2.5 h-2.5 w-24 rounded-full"),
    line2: cva("bg-base-muted h-2 w-32 rounded-full"),
    line3: cva("bg-base-muted h-2.5 w-12 rounded-full")
  }
};
