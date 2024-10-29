import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  currencySwitcher: {},

  product: {
    root: cva(),

    card: {
      root: cva(
        "bg-base text-base-foreground relative flex w-full flex-wrap items-stretch gap-6 rounded-lg border p-6",
        {
          variants: {
            isProcessing: {
              // true: "pointer-events-none opacity-50",
            },
            isDisabled: {
              // true: "pointer-events-none",
            },

            // hasErrors: {
            //   true: "border-error",
            // },

            // isNew: {
            //   true: "border-accent",
            // },

            // isNew: {
            //   true: "rounded-none border-none",
            // },
          },

          // compoundVariants: [
          //   {
          //     isLoading: false,
          //     hasErrors: true,
          //     class: "border-error",
          //   },
          //   {
          //     isLoading: false,
          //     isConfigured: false,
          //     class: "rounded-none border-none",
          //   },
          // ],

          defaultVariants: {
            isDisabled: false,
            // hasErrors: false,
            isConfigured: false,
          },
        }
      ),
      wrapper: cva("flex w-full flex-1 flex-wrap items-stretch gap-6"),
      media: cva("m-0 size-20 flex-none overflow-hidden rounded-lg p-0", {
        variants: {
          filled: {
            true: "bg-base-100 text-base-300 border",
          },
        },
      }),
      header: cva(
        "flex flex-1 flex-col items-start justify-center gap-2 text-left "
      ),
      content: cva(
        " order-last flex w-full flex-none flex-wrap gap-6 border-t pt-4 empty:hidden "
      ),
      collapsible: cva(
        "max-h-0 overflow-hidden opacity-0 transition aria-expanded:max-h-fit aria-expanded:opacity-100 aria-hidden:hidden"
      ),
      footer: cva(
        "flex max-w-xs flex-1 items-center justify-end gap-6 text-right"
      ),
      // ---
      loading: cva("size-7"),
      title: cva(
        "m-0 inline-flex w-full items-center gap-2 text-2xl font-normal leading-none tracking-wide"
      ),
      meta: cva(
        "text-base-700 m-0 flex w-full items-center gap-4 text-left text-sm lowercase leading-snug"
      ),

      text: cva("m-0 w-full text-left text-sm leading-normal"),
      bold: cva("font-medium", {
        variants: {
          isCalculating: {
            true: "text-base-300",
          },
        },
      }),
      total: cva("text-2xl font-medium leading-snug tracking-wide"),
      discount: cva(
        "text-md text-base-700 font-normal leading-snug tracking-wide line-through"
      ),
      // ---
      toggle: cva("size-3 transition-all aria-checked:rotate-180"),
      image: cva("h-full w-full object-cover"),
      actions: cva("flex items-center gap-2"),
      actionConfigure: cva("relative", {
        variants: {
          // hasErrors: {
          //   true: "motion-safe:animate-pulse",
          // },
          // isNew: {
          //   true: "motion-safe:animate-pulse",
          // },
        },
      }),
      summary: cva("inline-flex flex-col"),
      // ---
      details: {
        root: cva("m-0 grid w-full list-none grid-cols-4 gap-6 px-0 py-4"),
        item: cva("m-0 flex flex-wrap gap-0 p-0 "),
        title: cva(
          "text-base-500 m-0 w-full p-0 text-sm font-normal tracking-wide "
        ),
        text: cva("m-0 p-0 text-sm tracking-wide "),
        invalid: cva("text-error"),
      },
    },

    config: {
      root: cva(
        "bg-base text-base-foreground w-full overflow-hidden rounded-lg border",
        {
          variants: {
            isDisabled: {
              true: "pointer-events-none",
            },
            // hasErrors: {
            //   true: "border-error",
            // },
            // isNew: {
            //   true: "border-accent",
            // },
          },
        }
      ),

      header: cva(
        "flex items-center justify-center gap-2  px-6 py-1 text-center text-sm",
        {
          variants: {
            // hasErrors: {
            //   true: "bg-error text-error-foreground",
            // },
            // isNew: {
            //   true: "bg-accent text-accent-foreground",
            // },
          },
        }
      ),

      content: cva("flex flex-wrap  items-start gap-x-2"),

      media: cva("m-10 mr-0 size-80 flex-none overflow-hidden rounded-lg p-0", {
        variants: {
          filled: {
            true: "bg-base-100 text-base-300 border",
          },
        },
      }),
      wrapper: cva(
        "flex w-full flex-1 flex-wrap items-stretch gap-x-6 gap-y-16 p-10 "
      ),

      heading: cva("flex w-full flex-wrap items-end gap-x-10"),

      headingContent: cva("flex w-full flex-1 flex-wrap items-start gap-2 "),

      summary: cva("inline-flex items-end gap-x-6 gap-y-6", {
        variants: {
          isCalculating: {
            true: "text-base-300",
          },
        },
      }),

      fields: cva(
        "flex w-full flex-none flex-wrap items-start gap-x-6 gap-y-8 empty:hidden "
      ),

      footer: cva(
        " mt-6 flex w-full items-center justify-between gap-x-10 border-t px-6 py-4"
      ),
      // ---
      loading: cva("size-7"),
      title: cva("m-0 w-full text-4xl font-normal leading-none tracking-wide"),
      meta: cva(
        "text-base-700 m-0 flex w-full items-center gap-4 text-left text-sm lowercase leading-snug"
      ),
      text: cva("text-base-700 m-0 w-full text-left leading-normal"),
      bold: cva("font-medium", {
        variants: {
          isCalculating: {
            true: "text-base-300",
          },
        },
      }),
      // ---
      total: cva(
        "block text-right text-2xl font-medium leading-snug tracking-wide",
        {
          variants: {
            isCalculating: {
              true: "text-base-300",
            },
          },
        }
      ),
      itemtotal: cva(
        "text-base-700 m-0 flex w-full items-end justify-end gap-2 leading-normal",
        {
          variants: {
            isCalculating: {
              true: "text-base-300",
            },
          },
        }
      ),
      discount: cva(
        "text-md text-base-700 block w-full text-right font-normal leading-snug tracking-wide line-through",
        {
          variants: {
            isCalculating: {
              true: "text-base-300",
            },
          },
        }
      ),
      price: cva(""),
      // ---
      image: cva("h-full w-full object-cover"),
      actions: cva("flex items-center gap-2"),

      // ---
      grid: {
        root: cva("w-full p-0 ", {
          variants: {
            disabled: {
              true: "cursor-wait",
            },
          },
        }),
        items: cva(
          "m-0 grid w-full list-none grid-cols-[repeat(auto-fit,_minmax(14rem,_auto))] gap-3 p-0"
        ),
        item: {
          root: cva(
            "m-0 flex cursor-pointer flex-wrap items-start gap-2 gap-y-8 rounded-lg border px-4 py-3"
          ),
          selected: cva(
            "focus-within:border-control-active focus-within:ring-control-active focus-within:border focus-within:ring-4 focus-within:ring-opacity-20"
          ),
          disabled: cva("cursor-wait"),

          // input: cva("text-primary"),
          header: cva(
            "flex flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-0"
          ),
          footer: cva("flex w-full flex-none flex-col gap-1 self-end"),
          // ---
          title: cva("text-md m-0 font-normal"),
          text: cva("text-base-700 m-0 block w-full flex-none text-sm"),
          total: cva("text-2xl font-medium leading-snug tracking-wide"),
          discount: cva(
            "text-md text-base-700 font-normal leading-snug tracking-wide line-through"
          ),
        },
      },
      // ---
      list: {
        root: cva("w-full p-0 "),
        item: {
          header: cva(
            "flex flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-0"
          ),
          footer: cva(
            "flex-shrink-1 flex items-center justify-end gap-1 gap-4"
          ),
          title: cva("text-md m-0 font-normal"),
          badges: cva("flex items-center justify-end gap-4 px-4"),
          price: cva("min-w-20 text-right"),
          total: cva(
            "text-md block text-right font-medium leading-snug tracking-wide"
          ),
          discount: cva(
            "text-base-700 block text-right text-sm font-normal leading-snug  tracking-wide line-through"
          ),
        },
      },
      // ---
      form: {
        root: cva("w-full p-0", {
          variants: {
            disabled: {
              // true: "pointer-events-none",
            },
          },
        }),
        form: cva(""),
      },
    },

    notFound: {
      root: cva(
        "relative flex w-full flex-col flex-wrap items-center justify-center gap-6 py-16"
      ),
      title: cva("m-0 text-center text-3xl font-light text-inherit"),
      text: cva(
        "text-base-500 m-0 text-center text-sm leading-5 tracking-tight"
      ),
    },
  },
};
