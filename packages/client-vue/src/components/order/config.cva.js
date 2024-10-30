import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  order: {
    root: cva(""),
    confirmation: {
      root: cva(
        "relative flex w-full flex-col flex-wrap items-center justify-center gap-8 py-16"
      ),
      title: cva("m-0 text-center text-3xl text-inherit"),
      text: cva("m-0 text-center text-lg leading-5 tracking-tight opacity-50"),
      avatar: cva("bg-primary text-primary-foreground size-20 p-2"),
      actions: cva("flex w-full justify-center"),
    },
  },
};
