import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  control: {
    root: cva(
      "shadow-border-b flex w-full flex-shrink-0 items-center justify-center self-start bg-base-background px-2.5 py-4"
    ),
    container: cva("flex w-full items-center justify-between", {
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
    root: cva("py-18 w-full px-2.5", {
      variants: {
        overflow: {
          hidden: "overflow-hidden",
          visible: "overflow-visible"
        }
      }
    }),
    container: cva("max-w-app-lg mx-auto flex w-full flex-col gap-6"),
    content: cva("flex w-full flex-col gap-9 md:flex-row"),
    main: cva("flex w-full flex-col gap-6"),
    controlsRoot: cva("w-full border-b bg-base-background py-4"),
    controls: cva("max-w-app mx-auto"),
    aside: cva("flex w-full max-w-md flex-col gap-6")
  },

  full: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start", {
      variants: {
        overflow: {
          hidden: "overflow-hidden",
          visible: "overflow-visible"
        }
      }
    }),
    header: {
      root: cva("px-2.5", {
        variants: {
          isMinimal: {
            true: "py-18",
            false: "py-24"
          }
        }
      }),
      container: cva("max-w-app mx-auto")
    },
    content: {
      root: cva("px-2.5", {
        variants: {
          isMinimal: {
            true: "py-18",
            false: "py-24"
          },
          hasHeader: {
            true: "bg-base-background",
            false: ""
          }
        }
      }),
      container: cva(
        "max-w-app gap-18 mx-auto flex w-full flex-col md:flex-row"
      )
    },
    aside: cva("flex w-full max-w-md flex-col gap-12"),
    main: cva("flex w-full flex-col gap-12")
  }
};
