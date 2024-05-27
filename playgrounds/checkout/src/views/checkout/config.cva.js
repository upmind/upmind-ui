import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkout: {
    root: cva("flex flex-col !gap-0"),

    section: {
      root: cva(
        "relative flex w-full flex-wrap flex-wrap items-start justify-start gap-6 py-20"
      ),
      centered: cva(
        "min-h-[70vh] flex-col items-center justify-center text-center"
      ),
      disabled: cva("pointer-events-none opacity-50"),
      header: cva("flex w-full flex-col gap-2 "),
      title: cva(
        "m-0 flex w-full items-center justify-between gap-4 text-5xl font-light leading-tight  text-inherit"
      ),
      text: cva("m-0 text-lg font-light leading-7 text-base-700"),
      loading: cva(""),
      content: cva("relative flex w-full items-start"),
      footer: cva("w-full"),
    },
  },
};
