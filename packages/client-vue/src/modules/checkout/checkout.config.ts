import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  checkout: {
    setup: {
      productName: cva("text-muted text-sm"),
      continue: cva("mt-6 w-full"),
      skeleton: {
        root: cva("flex w-full flex-col gap-6"),
        field: cva("flex flex-col gap-2"),
        // varied label widths read as real content, not a repeated pattern
        label: cva("h-4 w-24"),
        labelWide: cva("h-4 w-28"),
        input: cva("h-10 w-full"),
        button: cva("h-12 w-full")
      }
    },
    billing: {
      // trailing placeholder under the saved-billing fields
      skeletonDetail: cva("mt-2 h-4 w-36")
    }
  }
};
