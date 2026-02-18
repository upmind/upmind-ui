import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  summary: {
    root: cva("flex flex-col gap-2 font-normal"),
    item: {
      root: cva("flex items-center justify-between font-medium"),
      term: cva("text-xl-loose flex-shrink-0 text-left"),
      description: cva("flex items-center gap-2 text-right text-3xl")
    }
  }
};
