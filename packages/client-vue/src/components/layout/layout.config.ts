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
        "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 lg:px-2.5"
      ),
      container: cva(
        "max-w-app mx-auto flex w-full items-center justify-between"
      )
    },
    content: {
      header: {
        root: cva("bg-canvas px-6", {
          variants: {
            hasContent: {
              true: "shadow-b-border-surface py-18",
              false: "py-12 lg:py-32"
            }
          }
        }),
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
        "max-w-app mx-auto flex w-full flex-col gap-12 lg:flex-row lg:gap-18"
      )
    },
    aside: cva("sticky top-6 flex w-full max-w-md flex-col gap-12 self-start"),
    main: cva("flex w-full flex-col gap-12")
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
    content: cva("flex w-full flex-col gap-9 lg:flex-row"),
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
        "bg-surface shadow-b-border-surface top-0 z-20 flex w-full flex-col items-center px-6 py-7 transition-all duration-500 lg:px-2.5"
      ),
      container: cva(
        "max-w-app mx-auto flex w-full items-center justify-between"
      )
    },
    content: {
      header: {
        root: cva("bg-canvas px-6", {
          variants: {
            hasContent: {
              true: "shadow-b-border-surface py-18",
              false: "py-12 lg:py-32"
            }
          }
        }),
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
        "max-w-app mx-auto flex w-full flex-col gap-12 lg:flex-row lg:gap-18"
      )
    },
    aside: cva("sticky top-6 flex w-full max-w-md flex-col gap-12 self-start"),
    main: cva("flex w-full flex-col gap-12")
  },

  twoColumnLTR: {
    root: cva(
      "bg-surface lg:canvas-gradient flex min-h-screen w-full flex-col",
      {
        variants: {
          overflow: {
            hidden: "overflow-hidden",
            visible: "overflow-visible"
          }
        }
      }
    ),
    row: cva("flex w-full justify-center"),
    header: {
      root: cva(
        "basis-app-content bg-surface w-app-content box-content h-24 min-w-0 px-8 lg:px-18"
      ),
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden h-24 min-w-0 px-18 lg:block"
      )
    },
    contentHeader: {
      root: cva(
        "lg:basis-app-content bg-surface lg:w-app-content box-content flex w-full min-w-0 flex-col gap-6 px-8 pt-18 lg:px-18"
      ),
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden min-w-0 px-18 pt-18 lg:block"
      )
    },
    content: {
      root: cva(
        "lg:basis-app-content bg-surface lg:w-app-content box-content flex w-full min-w-0 flex-col gap-12 px-8 pt-9 lg:px-18 lg:pt-18"
      ),
      aside: cva(
        "basis-app-aside box-content hidden min-w-0 px-18 pt-9 lg:block"
      ),
      asideInner: cva("w-app-aside sticky top-0 flex flex-col gap-6 pt-9")
    },
    spacer: {
      row: cva("flex w-full grow justify-center"),
      root: cva(
        "basis-app-content bg-surface w-app-content box-content min-h-56 min-w-0 px-8 lg:min-h-44 lg:px-18"
      ),
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden min-h-56 min-w-0 px-18 lg:block lg:min-h-44"
      )
    }
  },

  twoColumnRTL: {
    root: cva(
      "bg-surface lg:canvas-gradient-rtl flex min-h-screen w-full flex-col",
      {
        variants: {
          overflow: {
            hidden: "overflow-hidden",
            visible: "overflow-visible"
          }
        }
      }
    ),
    row: cva("flex w-full justify-center"),
    header: {
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden h-24 min-w-0 px-18 lg:block"
      ),
      root: cva(
        "basis-app-content bg-surface w-app-content box-content h-24 min-w-0 px-8 lg:px-18"
      )
    },
    content: {
      root: cva(
        "lg:basis-app-content bg-surface lg:w-app-content box-content flex w-full min-w-0 flex-col gap-12 px-8 pt-8 lg:px-18 lg:pt-18"
      ),
      aside: {
        root: cva(
          "basis-app-aside lg:w-app-aside box-content hidden min-w-0 px-18 pt-18 lg:block"
        ),
        container: cva("flex h-full flex-col gap-6"),
        header: cva("flex flex-col gap-9"),
        footer: cva("sticky top-0 flex flex-col gap-6 pt-9")
      }
    },
    spacer: {
      row: cva("flex w-full grow justify-center"),
      aside: cva(
        "basis-app-aside w-app-aside box-content hidden min-h-52 min-w-0 px-18 lg:block lg:min-h-44"
      ),
      root: cva(
        "basis-app-content bg-surface w-app-content box-content min-h-52 min-w-0 px-8 lg:min-h-44 lg:px-18"
      )
    }
  },

  split: {
    root: cva("flex min-h-screen w-full", {
      variants: {
        overflow: {
          hidden: "overflow-hidden",
          visible: "overflow-visible"
        }
      }
    }),
    container: cva(
      "bg-surface flex min-h-screen w-1/2 flex-col justify-between px-32 pt-24 pb-9"
    ),
    content: {
      root: cva("flex grow flex-col gap-4"),
      container: cva("flex grow flex-col gap-12"),
      header: cva("max-w-app-aside grow")
    },
    footer: cva("h-16"),
    aside: cva("bg-canvas min-h-screen w-1/2")
  },

  canvasCard: {
    root: cva("w-full px-6", {
      variants: {
        overflow: {
          hidden: "overflow-hidden",
          visible: "overflow-visible"
        }
      }
    }),
    container: cva("max-w-app mx-auto pt-9 pb-6"),
    header: cva("w-full"),
    card: cva(
      "bg-surface card-radius flex w-full flex-col justify-between gap-12 lg:flex-row lg:gap-32"
    ),
    contentHeader: cva("w-app-aside w-full"),
    content: cva("w-full")
  },

  surfaceBox: {
    root: cva("bg-surface flex min-h-screen w-full py-32", {
      variants: {
        overflow: {
          hidden: "overflow-hidden",
          visible: "overflow-visible"
        }
      }
    }),
    container: cva(
      "flex h-full w-full flex-col items-center justify-center px-6 lg:px-8"
    ),
    header: cva("flex h-24 w-full items-end justify-between"),
    card: cva(
      "bg-surface card-radius w-app-content max-w-app mx-auto flex w-full flex-col justify-between gap-9 border"
    ),
    contentHeader: cva("w-app-aside w-full"),
    content: cva("w-full")
  }
};
