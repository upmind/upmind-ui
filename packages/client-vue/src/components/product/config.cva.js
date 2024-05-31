import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  currencySwitcher: {},

  product: {
    root: cva(),

    card: {
      root: cva(
        "p-6 bg-base text-base-content border rounded-lg border-base-300 gap-6 flex flex-wrap items-stretch ",
        {
          variants: {
            isDisabled: {
              true: "pointer-events-none opacity-50",
            },

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
            hasErrors: false,
            isConfigured: false,
          },
        }
      ),
      wrapper: cva("gap-6 flex flex-wrap items-stretch w-full flex-1"),
      media: cva("flex-none size-20 rounded-lg overflow-hidden m-0 p-0", {
        variants: {
          filled: {
            true: "bg-base-100 border text-base-300",
          },
        },
      }),
      header: cva(
        "flex-1 flex flex-col justify-center text-left items-start gap-2 "
      ),
      content: cva(
        "w-full flex-none flex flex-wrap gap-6 order-last empty:hidden border-t border-base-300 pt-4 "
      ),
      collapsible: cva(
        "transition max-h-0 opacity-0 aria-expanded:opacity-100 aria-expanded:max-h-fit overflow-hidden aria-hidden:hidden"
      ),
      footer: cva(
        "flex max-w-xs flex-1 items-center text-right justify-end gap-6"
      ),
      // ---
      title: cva("w-full m-0 text-2xl font-normal leading-none tracking-wide"),
      meta: cva(
        "w-full flex gap-4 items-center text-left lowercase m-0 text-sm leading-snug text-base-700"
      ),
      text: cva("w-full text-left m-0 text-sm leading-normal"),
      bold: cva("font-medium", {
        variants: {
          isCalculating: {
            true: "text-base-300",
          },
        },
      }),
      total: cva("font-medium text-2xl leading-snug tracking-wide"),
      discount: cva(
        "font-normal text-md leading-snug tracking-wide line-through text-base-700"
      ),
      // ---
      toggle: cva("size-3 transition-all aria-checked:rotate-180"),
      image: cva("h-full w-full object-cover"),
      actions: cva("flex gap-2 items-center"),
      summary: cva("inline-flex flex-col"),
      // ---
      details: {
        root: cva("grid grid-cols-4 gap-6 py-4 px-0 m-0 list-none w-full"),
        item: cva("p-0 m-0 flex flex-col gap-0 "),
        full: cva("col-span-4"),
        title: cva(
          "font-normal text-base-500 m-0 text-sm tracking-wide m-0 p-0 "
        ),
        text: cva("m-0 text-sm tracking-wide m-0 p-0 "),
      },
    },

    config: {
      root: cva(
        "bg-base text-base-content border rounded-lg border-base-300 gap-x-12 flex flex-wrap items-start",
        {
          variants: {
            isDisabled: {
              true: "pointer-events-none opacity-50",
            },
          },
        }
      ),

      media: cva("flex-none size-80 rounded-lg overflow-hidden m-10 mr-0 p-0", {
        variants: {
          filled: {
            true: "bg-base-100 border text-base-300",
          },
        },
      }),

      wrapper: cva(
        "gap-x-6 gap-y-16 flex flex-wrap items-stretch w-full flex-1 p-10 pl-0 "
      ),

      header: cva("w-full flex flex-wrap items-end gap-x-10 gap-y-4"),

      headerContent: cva("w-full flex-1 flex flex-wrap items-start gap-2 "),

      summary: cva("inline-flex items-end gap-y-6 gap-x-6", {
        variants: {
          isCalculating: {
            true: "text-base-300",
          },
        },
      }),

      content: cva(
        "w-full flex-none flex flex-wrap gap-x-6 gap-y-16 empty:hidden items-start "
      ),

      footer: cva(
        "border-t border-base-300 px-6 mt-6 py-4 flex w-full items-center justify-between gap-x-10"
      ),
      // ---
      title: cva("w-full m-0 text-4xl font-normal leading-none tracking-wide"),
      meta: cva(
        "w-full flex gap-4 items-center text-left lowercase m-0 text-sm leading-snug text-base-700"
      ),
      text: cva("w-full text-left m-0 leading-normal text-base-700"),
      bold: cva("font-medium", {
        variants: {
          isCalculating: {
            true: "text-base-300",
          },
        },
      }),
      // ---
      total: cva(
        "block font-medium text-2xl leading-snug tracking-wide text-right",
        {
          variants: {
            isCalculating: {
              true: "text-base-300",
            },
          },
        }
      ),
      itemtotal: cva(
        "w-full justify-end m-0 leading-normal text-base-700 flex gap-2 items-end",
        {
          variants: {
            isCalculating: {
              true: "text-base-300",
            },
          },
        }
      ),
      discount: cva(
        "block font-normal text-md leading-snug tracking-wide line-through text-base-700 text-right w-full",
        {
          variants: {
            isCalculating: {
              true: "text-base-300",
            },
          },
        }
      ),
      price: cva(),
      // ---
      image: cva("h-full w-full object-cover"),
      actions: cva("flex gap-2 items-center"),

      // ---
      grid: {
        root: cva("w-full p-0 ", {
          variants: {
            disabled: {
              true: "pointer-events-none opacity-50",
            },
          },
        }),
        items: cva("p-0 m-0 list-none grid grid-cols-3 w-full gap-3"),
        item: {
          root: cva(
            "m-0 flex flex-wrap items-start gap-2 gap-y-8 cursor-pointer border px-4 py-3 rounded-lg"
          ),
          selected: cva("border-primary"),
          input: cva("text-primary"),
          header: cva(
            "flex flex-wrap gap-y-0 gap-x-2 justify-between items-center flex-1"
          ),
          footer: cva("w-full flex-none flex flex-col gap-1 self-end"),
          // ---
          title: cva("m-0 text-md font-normal"),
          text: cva("m-0 text-sm text-base-700 w-full flex-none block"),
          total: cva("font-medium text-2xl leading-snug tracking-wide"),
          discount: cva(
            "font-normal text-md leading-snug tracking-wide line-through text-base-700"
          ),
        },
      },
      // ---
      list: {
        root: cva("w-full p-0 ", {
          variants: {
            disabled: {
              true: "pointer-events-none opacity-50",
            },
          },
        }),
        items: cva("p-0 m-0 list-none grid grid-cols-1 w-full gap-0"),
        item: {
          root: cva(
            "flex flex-wrap items-center gap-2 gap-y-8 cursor-pointer m-0 px-4 py-3 rounded-lg border "
          ),
          selected: cva("border-primary"),
          input: cva("text-primary"),
          header: cva(
            "flex flex-wrap gap-y-0 gap-x-2 justify-between items-center flex-1"
          ),
          footer: cva(
            "flex-shrink-1 flex items-center gap-1 justify-end gap-4"
          ),
          // ---
          price: cva(),
          title: cva("m-0 text-md font-normal"),
          text: cva("m-0 text-sm text-base-700 w-full flex-none block"),
          total: cva(
            "font-medium text-md leading-snug tracking-wide block text-right"
          ),
          discount: cva(
            "font-normal text-sm leading-snug tracking-wide line-through text-base-700  block text-right"
          ),
        },
      },
      // ---
      form: {
        root: cva("w-full p-0", {
          variants: {
            disabled: {
              true: "pointer-events-none opacity-50",
            },
          },
        }),
        form: cva(""),
      },
    },
  },
};
