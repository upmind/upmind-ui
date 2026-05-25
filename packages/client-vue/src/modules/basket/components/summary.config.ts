import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  summary: {
    root: cva("flex flex-col gap-2 font-normal"),
    skeleton: cva("my-px ml-auto h-5 w-16"),
    item: {
      root: cva("flex items-center justify-between font-medium"),
      term: cva("text-xl-loose flex-shrink-0 text-left"),
      description: cva("flex items-center gap-2 text-right text-3xl"),
      skeleton: cva("my-px h-8 w-24")
    }
  }
};
