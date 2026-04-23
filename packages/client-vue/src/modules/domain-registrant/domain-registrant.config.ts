import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  domainRegistrant: {
    card: {},
    checkboxes: {
      root: cva("border-surface mt-6 flex flex-col gap-3 border-t pt-6"),
      item: cva("flex cursor-pointer items-center gap-2"),
      label: cva("text-sm"),
      tooltip: cva("text-muted")
    },

    review: {}
  }
};
