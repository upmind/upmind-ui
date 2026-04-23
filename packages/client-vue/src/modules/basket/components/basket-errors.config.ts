import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  basketErrors: {
    list: cva("text-sm-tight list-disc pl-3.5 text-left"),
    item: cva("text-sm marker:text-inherit")
  }
};
