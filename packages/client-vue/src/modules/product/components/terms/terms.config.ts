import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  terms: {
    radio: {
      root: cva("w-full", {
        variants: {
          disabled: {
            true: "cursor-wait"
          }
        }
      }),
      items: cva("list-none gap-3", {
        variants: {
          type: {
            "radio-grid": "grid",
            "radio-rows": "grid",
            select: ""
          },
          columns: {
            1: "grid-cols-1",
            2: "grid-cols-[repeat(auto-fit,minmax(max(48%,11rem),1fr))]",
            3: "grid-cols-[repeat(auto-fit,minmax(max(32%,11rem),1fr))]",
            4: "grid-cols-[repeat(auto-fit,minmax(max(23.5%,11rem),1fr))]"
          }
        },
        defaultVariants: {
          type: "radio-grid",
          columns: 2
        }
      }),
      item: {
        root: cva(
          "text-md m-0 flex h-full w-full cursor-pointer flex-col flex-wrap items-start rounded-lg sm:flex-row",
          {
            variants: {
              layout: {
                stacked: "gap-4 text-base",
                inline:
                  "w-full items-start justify-between gap-x-4 sm:items-center"
              }
            },
            defaultVariants: {
              layout: "stacked"
            }
          }
        ),
        header: cva("flex items-center gap-x-2 gap-y-1 leading-tight", {
          variants: {
            layout: {
              stacked: "flex-wrap items-center justify-start",
              inline: ""
            }
          },
          defaultVariants: {
            layout: "stacked"
          }
        }),
        footer: cva("flex", {
          variants: {
            layout: {
              stacked: "w-full flex-col gap-y-0.5 self-end",
              inline: "items-baseline gap-x-2"
            }
          },
          defaultVariants: {
            layout: "stacked"
          }
        }),
        title: cva("m-0 font-medium text-nowrap text-inherit", {
          variants: {
            layout: {
              stacked: "text-md-tight",
              inline: "text-md"
            }
          },
          defaultVariants: {
            layout: "stacked"
          }
        }),
        text: cva("text-muted w-full text-sm font-normal"),
        total: cva("", {
          variants: {
            layout: {
              stacked: "text-3xl font-medium",
              inline: "text-md font-medium"
            }
          },
          defaultVariants: {
            layout: "stacked"
          }
        }),
        ex: cva("", {
          variants: {
            layout: {
              stacked: "text-sm",
              inline: "text-sm"
            }
          },
          defaultVariants: {
            layout: "stacked"
          }
        }),
        discount: cva("text-2xs text-muted leading-none")
      }
    },
    select: {
      root: cva("w-full", {
        variants: {
          disabled: {
            true: "cursor-wait"
          }
        }
      })
    }
  }
};
