import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  currencySwitcher: {},

  basket: {
    root: cva(),

    summary: {
      root: cva("w-full flex flex-col gap-8 text-left"),
      header: cva("w-full"),
      title: cva("text-lg font-medium m-0 text-xl tracking-tight"),
      content: cva(
        "grid space-y-4 rounded-lg border border-base-300 shadow-md p-6 bg-base text-base-content w-full"
      ),
      form: cva(
        "border-t border-base-300 first:pt-0 first:border-t-0 pt-4 text-sm m-0"
      ),

      list: cva(
        "grid grid-cols-3 gap-0 border-t border-base-300 first:pt-0 first:border-t-0 pt-4 text-sm m-0"
      ),
      heading: cva(
        "font-light m-0 flex gap-2 items-center flex-1 col-span-2 group"
      ),

      text: cva(
        "text-left m-0 text-sm inline-flex items-start gap-2 leading-normal"
      ),
      value: cva("text-right m-0 flex-0"),
      product: cva("font-medium"),
      total: cva("font-medium "),
      icon: cva("size-5 flex-0 leading-normal"),
      tooltipIcon: cva("size-4 flex-0 leading-6"),
      tooltip: cva("m-0 text-xs hidden group-hover:block leading-tight "),

      footer: cva(
        "font-light flex flex-wrap gap-4 text-center justify-center w-full"
      ),
      actions: cva("w-full flex gap-2 justify-end"),
    },

    promotions: {
      root: cva("w-full flex flex-col gap-3 text-left"),
      header: cva(),
      toggle: cva("size-3 transition-all aria-checked:rotate-180"),
      title: cva("sr-only"),
      content: cva(),
      footer: cva(),

      form: {
        root: cva("flex-row gap-2"),
        actions: cva("items-center w-auto"),
      },
    },

    details: {
      root: cva("!gap-16 ", {
        variants: {
          isDisabled: {
            true: "pointer-events-none opacity-50",
          },
        },
        compoundVariants: [
          {
            hasProducts: false,
            hasAccount: false,
            class: "pointer-events-none opacity-50",
          },
        ],
      }),
      header: cva("w-full flex flex-col gap-2 "),
      title: cva(
        "m-0 flex items-center justify-between gap-4 text-5xl font-light leading-tight text-inherit"
      ),
      content: cva("w-full flex-1 flex flex-col gap-6"),
      footer: cva("max-w-xs w-full items-start sm:sticky sm:top-40 order-last"),
    },

    items: {
      root: cva("!gap-16 ", {
        variants: {
          isDisabled: {
            true: "pointer-events-none opacity-50",
          },
        },
      }),
      header: cva("w-full flex flex-col gap-2"),
      content: cva("w-full flex flex-col gap-4"),
      footer: cva("w-full flex gap-2 empty:hidden justify-end"),
      // ---
      title: cva(
        "m-0 flex items-center justify-between gap-4 text-5xl font-light leading-tight text-inherit"
      ),
      // ---
      invalid: {
        root: cva(
          "bg-error text-error-content border border-error rounded-lg flex flex-col"
        ),
        header: cva(
          "flex items-center gap-2 px-6 py-1 text-center justify-center tetx-sm"
        ),
        footer: cva("empty:hidden flex gap-2 justify-end p-4"),
      },
    },

    item: {
      root: cva(
        "p-6 bg-base text-base-content border rounded-lg border-base-300 gap-6 flex flex-wrap items-stretch ",
        {
          variants: {
            isDisabled: {
              true: "pointer-events-none opacity-50",
            },

            isNew: {
              true: "border-error",
            },
          },

          compoundVariants: [
            {
              isLoading: false,
              hasErrors: true,
              class: "border-error",
            },
            {
              isLoading: false,
              isConfigured: false,
              class: "border-error",
            },
          ],
          defaultVariants: {
            isDisabled: false,
            hasErrors: false,
            isConfigured: false,
          },
        }
      ),
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
        "w-full flex-none flex flex-wrap gap-6 order-last empty:hidden border-t border-base-300 pt-2 "
      ),
      collapsible: cva(
        "transition max-h-0 opacity-0 aria-expanded:opacity-100 aria-expanded:max-h-fit overflow-hidden aria-hidden:hidden"
      ),
      footer: cva("flex max-w-xs flex-1 items-center text-right justify-end"),
      // ---
      title: cva("w-full m-0 text-2xl font-normal leading-none tracking-wide"),
      details: cva(
        "w-full flex gap-2 items-center text-left lowercase m-0 text-sm leading-snug"
      ),
      text: cva("w-full text-left m-0 mt-3 text-sm leading-normal"),
      total: cva("font-semibold text-2xl leading-snug tracking-wide"),
      discount: cva(
        "font-normal text-md leading-snug tracking-wide line-through"
      ),
      // ---
      toggle: cva("size-3 transition-all aria-checked:rotate-180"),
      image: cva("h-full w-full object-cover"),
      actions: cva(""),
      summary: cva("inline-flex flex-col"),
    },

    paymentDetails: {
      root: cva(""),
      render: cva(""),
    },

    paymentGateway: {
      root: cva("flex flex-col gap-6 py-6 "),
      render: cva("empty:hidden p-6 rounded-lg border border-base-300"),
    },

    confirmation: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-wrap flex-wrap items-start justify-start gap-6 py-16 flex-col justify-center items-center",
        {
          variants: {},
        }
      ),
      title: cva("text-3xl font-light m-0 text-center text-inherit"),
      text: cva(
        "text-sm  leading-5 tracking-tight text-center m-0 text-base-500"
      ),
      avatar: cva("size-20 bg-primary text-primary-content p-2"),
    },

    empty: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-wrap flex-wrap items-start justify-start gap-6 py-16 flex-col justify-center items-center",
        {
          variants: {},
        }
      ),
      title: cva("text-3xl font-light m-0 text-center text-inherit"),
      text: cva(
        "text-sm  leading-5 tracking-tight text-center m-0 text-base-500"
      ),
      avatar: cva("size-20 bg-primary text-primary-content p-2"),
    },
  },
};
