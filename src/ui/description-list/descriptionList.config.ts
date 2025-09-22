// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  list: {
    root: cva("text-sm/loose"),
    term: cva("text-left", {
      variants: {
        hasEmphasis: {
          true: "text-text-muted",
          false: "text-text-muted"
        }
      }
    }),
    description: cva("text-right", {
      variants: {
        hasEmphasis: {
          true: "",
          false: "text-text-muted"
        }
      }
    }),
    item: cva("flex items-center justify-between"),
    slotItem: cva("flex items-center justify-between")
  }
};
