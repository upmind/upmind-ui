import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  domain: {
    root: cva("flex flex-col gap-6"),
    choices: cva(""),
    search: cva(""),
    // ---
    listings: {
      root: cva(""),
    },
    empty: {
      root: cva(
        "bg-base-100 flex flex-col items-center justify-center gap-4 rounded-lg p-4"
      ),
      title: cva("m-0 text-inherit"),
      text: cva("text-base-700 m-0 text-center"),
      icon: cva("text-base-700 size-8"),
    },
  },
};
