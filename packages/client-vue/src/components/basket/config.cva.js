import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  currencySwitcher: {},

  basket: {
    root: cva(),

    summary: {
      root: cva("w-full flex flex-col gap-8 text-left"),
      header: cva("w-full"),
      title: cva("text-lg font-normal m-0 text-xl tracking-tight"),
      content: cva(
        "grid space-y-4 rounded-lg border border-base-300 shadow-md p-6 bg-base text-base-content w-full"
      ),
      form: cva(
        "border-t border-base-300 first:pt-0 first:border-t-0 pt-4 text-sm m-0"
      ),
      list: cva(
        "grid grid-cols-2 gap-0 border-t border-base-300 first-of-type:pt-0 first-of-type:border-t-0 pt-4 text-sm m-0"
      ),
      heading: cva("font-light m-0 flex gap-2 items-center flex-1 group"),
      text: cva(
        "text-left m-0 text-sm inline-flex items-start gap-2 leading-normal font-normal text-base-700"
      ),
      bold: cva("font-medium text-base-content"),
      value: cva("text-right m-0 flex-0 text-base-content font-medium"),
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
      footer: cva("flex gap-1 items-center"),

      form: {
        root: cva("flex-row gap-0"),
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
      text: cva("m-0 text-lg font-light text-base-700 leading-7"),
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
      text: cva("m-0 text-lg font-light text-base-700 leading-7"),

      // ---
      pending: {
        root: cva(
          "bg-error text-error-content border border-error rounded-lg gap-0"
        ),
        header: cva(
          "flex items-center gap-2 px-6 py-1 text-center justify-center text-sm"
        ),
        content: cva("flex flex-col rounded-lg"),
        item: cva("rounded-none border-b-0 last:rounded-b-lg"),
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
      bold: cva("font-medium "),
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
