import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkout: {
    root: cva(),
    summary: cva("max-w-sm sm:sticky sm:top-40"),

    section: {
      root: cva(
        "relative flex min-h-[70vh] w-full flex-wrap flex-wrap items-start justify-start gap-8 py-20"
      ),
      centered: cva("flex-col items-center justify-center text-center"),

      header: cva("w-full"),
      title: cva("flex items-center justify-between gap-4"),
      loading: cva(""),
      content: cva("relative flex w-full items-start gap-4 p-4"),
      footer: cva("w-full"),
    },
  },
};
