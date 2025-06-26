import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  default: {
    root: cva("max-w-app mx-auto pb-16 pt-10 md:pb-32 md:pt-16"),
  },

  enclosed: {
    root: cva(
      "max-w-app z-10 mx-auto flex w-full flex-col flex-wrap items-start justify-start gap-6 pb-16 pt-10 md:pb-32 md:pt-16"
    ),
    controlsRoot: cva("border-b bg-base-background py-4"),
    controls: cva("max-w-app mx-auto"),
  },

  full: {
    root: cva("z-10 mx-auto w-full flex-wrap items-start justify-start"),
    controlsRoot: cva("border-b bg-base-background py-4"),
    controls: cva("max-w-app mx-auto"),
    header: cva("max-w-app mx-auto pb-10 pt-10 md:pb-20 md:pt-14"),
    contentRoot: cva("bg-base-background pb-10 pt-10 md:pb-16 md:pt-20"),
    content: cva("max-w-app mx-auto"),
  },
};
