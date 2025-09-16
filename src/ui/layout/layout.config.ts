import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  control: {
    root: cva(
      "shadow-border-b-control bg-base-background flex w-full shrink-0 items-center justify-center self-start px-6 py-4 md:px-2.5"
    ),
    container: cva("flex w-full items-center justify-between", {
      variants: {
        variant: {
          default: "max-w-app",
          full: "max-w-app",
          enclosed: "max-w-app-lg"
        }
      }
    }),
    controls: cva("grow")
  },

  default: {
    root: cva("mx-auto w-full flex-wrap items-start justify-start"),
    header: cva("max-w-app mx-auto pt-10 pb-10 md:pt-14 md:pb-20"),
    contentRoot: cva("pt-10 pb-10 md:pt-20 md:pb-16"),
    content: cva("max-w-app mx-auto")
  },

  enclosed: {
    root: cva("w-full px-2.5 py-18", {
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
    controlsRoot: cva("bg-base-background w-full border-b py-4"),
    controls: cva("max-w-app mx-auto"),
    aside: cva("flex w-full max-w-md flex-col gap-6", {
      variants: {
        isSticky: {
          true: "sticky top-6 self-start",
          false: ""
        }
      }
    })
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
      root: cva("px-6 md:px-2.5", {
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
      root: cva("px-6 md:px-2.5", {
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
        "max-w-app mx-auto flex w-full flex-col gap-6 md:flex-row md:gap-18"
      )
    },
    aside: cva("flex w-full max-w-md flex-col gap-12", {
      variants: {
        isSticky: {
          true: "sticky top-6 self-start",
          false: ""
        }
      }
    }),
    main: cva("flex w-full flex-col gap-12")
  }
};
