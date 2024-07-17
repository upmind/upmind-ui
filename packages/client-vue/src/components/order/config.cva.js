import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  order: {
    root: cva(""),
    confirmation: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-col flex-wrap flex-wrap items-start items-center justify-center justify-center px-6 py-16",
        {
          variants: {},
        }
      ),
      title: cva("m-0 mt-8 text-center text-3xl font-light text-inherit"),
      text: cva("text-base-500 m-0 mt-2 text-center text-sm tracking-tight"),
      avatar: cva("bg-primary text-primary-content size-20 p-2"),
      actions: cva("flex w-full justify-center pt-8"),
    },
  },
};
