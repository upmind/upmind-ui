import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  control: {
    root: cva(
      "shadow-b-border-surface bg-surface flex w-full shrink-0 items-center justify-center self-start px-6 py-4"
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
      root: cva(
        "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 md:px-2.5"
      ),
      container: cva(
        "max-w-app mx-auto flex w-full items-center justify-between"
      )
    },
    content: {
      header: {
        root: cva("bg-canvas shadow-b-border-surface px-6 py-18"),
        container: cva("max-w-app mx-auto")
      },
      root: cva("px-6", {
        variants: {
          isMinimal: {
            true: "py-18",
            false: "py-24"
          },
          hasContentHeader: {
            true: "bg-surface",
            false: "bg-canvas"
          }
        }
      }),
      container: cva(
        "max-w-app mx-auto flex w-full flex-col gap-12 md:flex-row md:gap-18"
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
  },

  twoColumnLTR: {
    root: cva("bg-surface lg:canvas-gradient w-full"),
    header: {
      row: cva("flex w-full justify-center"),
      contentWrapper: cva(
        "basis-app-content bg-surface box-content min-w-0 px-8 pb-1 lg:px-18"
      ),
      contentInner: cva("lg:w-app-content flex h-[100px] items-end"),
      asideWrapper: cva(
        "basis-app-aside bg-surface box-content min-w-0 px-8 pb-1 lg:bg-transparent lg:px-18"
      ),
      asideInner: cva("lg:w-app-aside flex h-[100px] items-end justify-end")
    },
    contentHeader: {
      row: cva("flex w-full justify-center"),
      contentWrapper: cva(
        "lg:basis-app-content bg-surface box-content w-full min-w-0 px-8 pt-18 lg:px-18"
      ),
      contentInner: cva("lg:w-app-content"),
      asideWrapper: cva(
        "basis-app-aside box-content hidden min-w-0 px-18 pt-18 lg:block"
      ),
      asideInner: cva("w-app-aside")
    },
    content: {
      row: cva("flex w-full justify-center"),
      contentWrapper: cva(
        "lg:basis-app-content bg-surface box-content w-full min-w-0 px-8 pt-18 lg:px-18"
      ),
      contentInner: cva("lg:w-app-content flex flex-col gap-12"),
      asideWrapper: cva(
        "basis-app-aside box-content hidden min-w-0 px-18 pt-9 lg:block"
      ),
      asideInner: cva("w-app-aside sticky top-0 pt-9")
    },
    spacer: {
      row: cva("flex w-full justify-center"),
      contentWrapper: cva(
        "basis-app-content bg-surface box-content min-w-0 px-8 lg:px-18"
      ),
      contentInner: cva("w-app-content h-11"),
      asideWrapper: cva(
        "basis-app-aside box-content hidden min-w-0 px-18 lg:block"
      ),
      asideInner: cva("w-app-aside h-11")
    },
    footer: {
      row: cva("flex w-full justify-center lg:items-end"),
      contentWrapper: cva(
        "lg:basis-app-content bg-surface box-content w-full min-w-0 px-8 pb-9 lg:px-18 lg:pt-18"
      ),
      contentInner: cva("lg:w-app-content"),
      asideWrapper: cva(
        "basis-app-aside box-content min-w-0 px-18 pb-9 lg:pt-18"
      ),
      asideInner: cva("w-app-aside hidden lg:block")
    }
  },

  footer: {
    root: cva("bg-surface shadow-t-border-surface w-full px-6 py-6 text-base"),
    container: cva(
      "max-w-app divide-border-surface mx-auto flex w-full flex-col divide-y [&>*]:py-6"
    ),
    actions: cva("flex justify-center gap-2 md:justify-end"),
    content: cva(
      "flex flex-col justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left"
    )
  }
};
