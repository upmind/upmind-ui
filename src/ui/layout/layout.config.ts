import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  default: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    controlsRoot: cva("w-full border-b bg-base-background py-4"),
    controls: cva("max-w-app mx-auto"),
    header: cva("max-w-app mx-auto pb-10 pt-10 md:pb-20 md:pt-14"),
    contentRoot: cva("pb-10 pt-10 md:pb-16 md:pt-20"),
    content: cva("max-w-app mx-auto")
  },

  enclosed: {
    root: cva(
      "max-w-app mx-auto flex w-full flex-col flex-wrap items-start justify-start gap-6 pb-16 pt-10 md:pb-32 md:pt-16"
    ),
    controlsRoot: cva("w-full border-b bg-base-background py-4"),
    controls: cva("max-w-app mx-auto")
  },

  full: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    controlsRoot: cva(
      "flex h-12 w-full items-center justify-center border-b bg-base-background"
    ),
    controls: cva("max-w-app flex w-full items-center justify-between"),
    header: cva("max-w-app mx-auto pb-10 pt-10 md:pb-20 md:pt-14"),
    contentRoot: cva("pb-10 pt-10 md:pb-16 md:pt-20", {
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
