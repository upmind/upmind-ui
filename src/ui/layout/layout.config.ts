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
    row: cva("flex w-full justify-center"),
    header: {
      content: cva(
        "basis-app-content bg-surface lg:w-app-content box-content flex h-24 w-full min-w-0 items-end px-8 pb-1 lg:px-18"
      ),
      aside: cva(
        "basis-app-aside bg-surface lg:w-app-aside box-content flex h-24 w-full min-w-0 items-end justify-end px-8 pb-1 lg:bg-transparent lg:px-18"
      )
    },
    contentHeader: {
      content: cva(
        "lg:basis-app-content bg-surface lg:w-app-content box-content w-full min-w-0 px-8 pt-18 lg:px-18"
      ),
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden min-w-0 px-18 pt-18 lg:block"
      )
    },
    content: {
      content: cva(
        "lg:basis-app-content bg-surface lg:w-app-content box-content flex w-full min-w-0 flex-col gap-12 px-8 pt-18 lg:px-18"
      ),
      aside: cva(
        "basis-app-aside box-content hidden min-w-0 px-18 pt-9 lg:block"
      ),
      asideInner: cva("w-app-aside sticky top-0 pt-9")
    },
    spacer: {
      content: cva(
        "basis-app-content bg-surface w-app-content box-content h-11 min-w-0 px-8 lg:px-18"
      ),
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden h-11 min-w-0 px-18 lg:block"
      )
    },
    footer: {
      row: cva(
        "flex flex-col items-center justify-center lg:w-full lg:flex-row lg:items-end"
      ),
      aside: cva(
        "lg:basis-app-aside lg:w-app-aside box-content min-w-0 pb-9 lg:px-18 lg:pt-18"
      ),
      content: cva(
        "lg:basis-app-content bg-surface w-app-content box-content flex min-w-0 flex-col-reverse items-center justify-between gap-4 pb-2 lg:flex-row lg:items-end lg:gap-0 lg:px-18 lg:pt-18 lg:pb-9"
      )
    }
  },

  twoColumnRTL: {
    root: cva("bg-surface lg:canvas-gradient-rtl w-full"),
    row: cva("flex w-full justify-center"),
    header: {
      aside: cva(
        "basis-app-aside bg-surface lg:w-app-aside box-content flex h-24 w-full min-w-0 items-end px-8 pb-1 lg:bg-transparent lg:px-18"
      ),
      content: cva(
        "basis-app-content bg-surface lg:w-app-content box-content flex h-24 w-full min-w-0 items-end justify-end px-8 pb-1 lg:px-18"
      )
    },
    content: {
      aside: cva(
        "basis-app-aside lg:w-app-aside box-content hidden min-w-0 px-18 pt-18 lg:block"
      ),
      asideInner: cva("flex h-full min-h-screen flex-col"),
      asideSticky: cva("sticky bottom-18 mt-auto"),
      content: cva(
        "lg:basis-app-content bg-surface lg:w-app-content box-content flex w-full min-w-0 flex-col gap-12 px-8 pt-18 lg:px-18"
      )
    },
    spacer: {
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden h-11 min-w-0 px-18 lg:block"
      ),
      content: cva(
        "basis-app-content bg-surface w-app-content box-content h-11 min-w-0 px-8 lg:px-18"
      )
    },
    footer: {
      row: cva(
        "flex w-full flex-col-reverse items-center justify-center lg:flex-row lg:items-end"
      ),
      aside: cva(
        "lg:basis-app-aside lg:w-app-aside box-content min-w-0 pb-9 lg:px-18 lg:pt-18"
      ),
      content: cva(
        "lg:basis-app-content bg-surface w-app-content box-content flex min-w-0 flex-col-reverse items-center justify-between gap-4 pb-2 lg:flex-row lg:items-end lg:gap-0 lg:px-18 lg:pt-18 lg:pb-9"
      )
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
  },

  split: {
    root: cva("flex min-h-screen w-full"),
    article: cva(
      "bg-surface flex min-h-screen w-1/2 flex-col justify-between px-32 pt-24 pb-9"
    ),
    header: cva("pb-24"),
    contentWrapper: cva("flex flex-col gap-24"),
    contentInner: cva("flex flex-col gap-12"),
    contentHeader: cva("max-w-app-aside"),
    content: cva(""),
    footer: cva("flex items-end justify-between"),
    aside: cva("bg-canvas min-h-screen w-1/2")
  }
};
