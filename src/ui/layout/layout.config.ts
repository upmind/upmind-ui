import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  control: {
    root: cva(
      "shadow-border-b flex w-full flex-shrink-0 items-center justify-center self-start bg-base-background px-[10px] py-4"
    ),
    content: cva("flex w-full items-center justify-between", {
      variants: {
        variant: {
          full: "max-w-app",
          enclosed: "max-w-app-lg"
        }
      }
    }),
    controls: cva("flex-grow")
  },

  default: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    header: cva("max-w-app mx-auto pb-10 pt-10 md:pb-20 md:pt-14"),
    contentRoot: cva("pb-10 pt-10 md:pb-16 md:pt-20"),
    content: cva("max-w-app mx-auto")
  },

  enclosed: {
    root: cva("max-w-app-lg mx-auto flex w-full flex-col gap-6 py-[72px]"),
    content: cva("flex w-full flex-col gap-9 md:flex-row"),
    main: cva("flex w-full flex-col gap-6"),
    controlsRoot: cva("w-full border-b bg-base-background py-4"),
    controls: cva("max-w-app mx-auto"),
    aside: cva("w-full max-w-md")
  },

  full: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    header: {
      root: cva("px-[10px]", {
        variants: {
          isMinimal: {
            true: "py-[72px]",
            false: "py-24"
          }
        }
      }),
      container: cva("max-w-app mx-auto")
    },
    content: {
      root: cva("px-[10px]", {
        variants: {
          isMinimal: {
            true: "py-[72px]",
            false: "py-24"
          },
          hasHeader: {
            true: "bg-base-background",
            false: ""
          }
        }
      }),
      container: cva(
        "max-w-app mx-auto flex w-full flex-col gap-[72px] md:flex-row"
      )
    },
    aside: cva("w-full max-w-md"),
    main: cva("flex w-full flex-col gap-12")
  }
};
