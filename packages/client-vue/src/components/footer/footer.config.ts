import { cva } from "class-variance-authority";

export const variants = {
  position: {
    static: "",
    absolute: "absolute top-0"
  }
};

export default {
  footer: {
    stacked: {
      root: cva("bg-surface"),
      column: cva("", {
        variants: {
          isMinimal: {
            true: "py-2 lg:py-2"
          }
        },
        defaultVariants: {
          isMinimal: false
        }
      }),
      content: cva("divide-border-surface flex w-full flex-col divide-y"),
      top: cva("flex w-full justify-center gap-2 pb-6 md:justify-end"),
      bottom: cva(
        "flex w-full flex-col items-center justify-between gap-2 text-center md:flex-row md:gap-0 md:text-left",
        {
          variants: {
            isMinimal: {
              false: "pt-6"
            },
            showPoweredBy: {
              false: "md:justify-end"
            }
          },
          defaultVariants: {
            isMinimal: false,
            showPoweredBy: true
          }
        }
      )
    },
    flat: {
      root: cva("", {
        variants
      }),
      container: cva("flex-row lg:flex-row"),
      left: {
        column: cva("justify-end self-stretch pt-18 pb-9 lg:pt-18 lg:pb-9", {
          variants: {
            background: {
              LTR: "flex-1",
              RTL: "bg-canvas flex-none"
            }
          }
        }),
        content: cva("w-full flex-wrap gap-4 py-0 lg:py-0", {
          variants: {
            background: {
              LTR: "",
              RTL: "max-w-app-aside lg:min-w-app-aside"
            }
          }
        })
      },
      right: {
        column: cva("justify-end self-stretch pt-18 pb-9 lg:pt-18 lg:pb-9", {
          variants: {
            background: {
              LTR: "bg-canvas flex-none",
              RTL: "flex-1"
            }
          }
        }),
        content: cva("flex w-full gap-2 py-0 lg:py-0", {
          variants: {
            background: {
              LTR: "max-w-app-aside lg:min-w-app-aside",
              RTL: ""
            }
          }
        })
      }
    },

    copyright: cva("text-muted text-sm whitespace-nowrap")
  }
};
