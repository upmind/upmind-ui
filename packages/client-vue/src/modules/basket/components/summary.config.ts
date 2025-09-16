import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  summary: {
    root: cva("flex flex-col gap-2"),
    item: {
      root: cva("mt-2 flex items-center justify-between font-medium"),
      term: cva("flex-shrink-0 text-left text-xl/loose"),
      description: cva("flex items-center gap-2 text-right text-3xl")
    }
  }
};
