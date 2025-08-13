import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  control: {
    root: cva(
      "bg-base-background flex w-full shrink-0 items-center justify-center self-start border-b py-4 leading-7"
    ),
    content: cva("max-w-app flex w-full items-center justify-between"),
    controls: cva("grow")
  },

  default: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    header: cva("max-w-app mx-auto pt-10 pb-10 md:pt-14 md:pb-20"),
    contentRoot: cva("pt-10 pb-10 md:pt-20 md:pb-16"),
    content: cva("max-w-app mx-auto")
  },

  enclosed: {
    root: cva(
      "max-w-app mx-auto flex w-full flex-col flex-wrap items-start justify-start gap-6 pt-10 pb-16 md:pt-16 md:pb-32"
    ),
    controlsRoot: cva("bg-base-background w-full border-b py-4"),
    controls: cva("max-w-app mx-auto")
  },

  full: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    header: cva("max-w-app mx-auto pt-10 pb-10 md:pt-14 md:pb-20"),
    contentRoot: cva("pt-10 pb-10 md:pt-20 md:pb-16", {
      variants: {
        hasHeader: {
          true: "bg-base-background",
          false: ""
        }
      }
    }),
    content: cva("max-w-app mx-auto")
  }
};
