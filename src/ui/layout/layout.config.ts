import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  control: {
    root: cva(
      "shadow-border-b flex w-full flex-shrink-0 items-center justify-center self-start bg-base-background py-4 leading-7"
    ),
    content: cva("max-w-app flex w-full items-center justify-between"),
    controls: cva("flex-grow")
  },

  default: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    header: cva("max-w-app mx-auto pb-10 pt-10 md:pb-20 md:pt-14"),
    contentRoot: cva("pb-10 pt-10 md:pb-16 md:pt-20"),
    content: cva("max-w-app mx-auto")
  },

  enclosed: {
    root: cva("max-w-app mx-auto flex w-full gap-9 py-[72px]"),
    main: cva("flex w-full flex-col gap-6"),
    controlsRoot: cva("w-full border-b bg-base-background py-4"),
    controls: cva("max-w-app mx-auto"),
    aside: cva("w-full max-w-md")
  },

  full: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    header: cva("max-w-app mx-auto px-[10px]", {
      variants: {
        isMinimal: {
          true: "py-[72px]",
          false: "py-24"
        }
      }
    }),
    contentRoot: cva("px-[10px] py-24", {
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
