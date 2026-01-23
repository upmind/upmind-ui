// --- external
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------
export default {
  table: {
    root: cva("w-full text-sm"),
    header: {
      root: cva(""),
      cell: cva(
        "border-control-default text-faint border-b pb-4 pl-6 text-right font-medium whitespace-nowrap first:w-full first:pl-0 first:text-left"
      ),
      content: cva("inline-flex items-center gap-1"),
      tooltip: cva(""),
      icon: cva("")
    },
    body: cva(""),
    row: {
      root: cva(""),
      cell: cva(
        "pt-2 pl-6 text-right font-normal whitespace-nowrap first:w-full first:pl-0 first:text-left data-[emphasis=true]:font-medium [tr:first-child>&]:pt-4"
      )
    }
  }
};
