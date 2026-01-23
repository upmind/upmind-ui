// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  table: {
    root: cva("w-full border-separate border-spacing-y-4"),
    header: {
      root: cva(""),
      cell: cva(
        "border-control-default text-faint border-b pb-4 pl-6 text-right font-medium whitespace-nowrap first:w-full first:pl-0 first:text-left"
      )
    },
    body: cva(""),
    row: {
      root: cva(""),
      cell: cva(
        "pl-6 text-right font-normal whitespace-nowrap first:w-full first:pl-0 first:text-left data-[emphasis=true]:font-medium"
      )
    }
  }
};
