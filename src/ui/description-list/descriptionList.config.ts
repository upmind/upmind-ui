// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  list: {
    root: cva("text-sm/loose"),
    term: cva("text-emphasis-medium flex-shrink-0 text-left"),
    description: cva("text-right"),
    item: cva("flex items-center justify-between"),
    slotItem: cva("flex items-center justify-between")
  }
};
