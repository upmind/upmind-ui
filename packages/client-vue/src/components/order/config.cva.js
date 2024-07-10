import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  order: {
    root: cva(""),
    confirmation: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-wrap flex-wrap items-start justify-center py-16 px-6 flex-col justify-center items-center",
        {
          variants: {},
        }
      ),
      title: cva("text-3xl font-light m-0 mt-8 text-center text-inherit"),
      text: cva("text-sm tracking-tight text-center m-0 mt-2 text-base-500"),
      avatar: cva("size-20 bg-primary text-primary-content p-2"),
      actions: cva("flex w-full justify-center pt-8"),
    },
  },
};
