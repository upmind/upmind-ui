// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  list: {
    root: cva("text-sm/loose"),
    term: cva("text-left", {
      variants: {
        hasEmphasis: {
          true: "text-emphasis-medium",
          false: "text-emphasis-medium"
        }
      }
    }),
    description: cva("text-right", {
      variants: {
        hasEmphasis: {
          true: "",
          false: "text-emphasis-medium"
        }
      }
    }),
    item: cva("flex items-center justify-between"),
    slotItem: cva("flex items-center justify-between")
  }
};
