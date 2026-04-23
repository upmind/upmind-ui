import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  basketWarnings: {
    root: cva("w-full"),
    list: cva("text-sm-tight list-disc pl-3.5 text-left"),
    item: cva("text-sm marker:text-inherit")
  }
};
