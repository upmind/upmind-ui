// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  table: {
    root: cva("w-full"),
    header: cva(""),
    body: cva(""),
    row: cva(""),
    headerCell: cva("p-2 text-left"),
    cell: cva("p-2 text-left")
  }
};
