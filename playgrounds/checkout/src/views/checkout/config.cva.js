import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  section: {
    root: cva(
      "flex flex min-h-[70vh] w-full items-start justify-start gap-8 py-20 "
    ),
    centered: cva("flex-col items-center justify-center text-center"),

    header: cva("w-full"),
    title: cva("flex items-center justify-between gap-4"),
    loading: cva(""),
    content: cva("flex w-full flex-col gap-4 p-4"),
    footer: cva("w-full"),
  },
};
