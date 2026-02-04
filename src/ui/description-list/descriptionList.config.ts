// --- external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  list: {
    root: cva("text-sm-loose"),
    term: cva("text-muted text-left"),
    description: cva("text-right text-base"),
    item: cva("flex items-center justify-between"),
    slotItem: cva("flex items-center justify-between")
  }
};
