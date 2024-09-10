import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  currencySwitcher: {},

  basket: {
    root: cva(),

    summary: {
      root: cva("flex w-full flex-col gap-8 text-left"),
      header: cva("w-full"),
      title: cva("m-0 text-lg text-xl font-normal tracking-tight"),
      content: cva(
        " bg-base text-base-content grid w-full space-y-4 rounded-lg border p-6 shadow-md"
      ),
      form: cva(" m-0 border-t pt-4 text-sm first:border-t-0 first:pt-0"),
      list: cva(
        " m-0 grid grid-cols-2 gap-0 border-t pt-4 text-sm first-of-type:border-t-0 first-of-type:pt-0"
      ),
      heading: cva("group m-0 flex flex-1 items-center gap-2 font-light"),
      text: cva(
        "text-base-700 m-0 inline-flex items-end gap-2 text-left text-sm font-normal leading-normal"
      ),
      bold: cva("text-base-content font-medium"),
      discount: cva("text-base-500 block text-xs font-light line-through"),
      value: cva("flex-0 text-base-content m-0 block text-right font-medium "),
      total: cva("font-medium "),
      icon: cva("flex-0 size-5 leading-normal"),
      tooltipIcon: cva("flex-0 size-4 leading-6"),
      tooltip: cva("m-0 hidden text-xs leading-tight group-hover:block "),

      footer: cva(
        "flex w-full flex-wrap justify-center gap-4 text-center font-light"
      ),
      actions: cva("flex w-full justify-end gap-2"),
    },

    promotions: {
      root: cva("flex w-full flex-col gap-3 text-left"),
      header: cva(),
      toggle: cva("size-3 transition-all aria-checked:rotate-180"),
      title: cva("sr-only"),
      content: cva(),
      footer: cva("flex flex-wrap items-center gap-1"),

      form: {
        root: cva("flex-row gap-1"),
        actions: cva("w-auto items-start"),
      },
    },

    details: {
      root: cva("!gap-16 ", {
        variants: {
          isDisabled: {
            true: "pointer-events-none",
          },
        },
        defaultVariants: {
          isDisabled: false,
        },
        compoundVariants: [
          {
            isAvailable: false,
            class: "pointer-events-none",
          },
        ],
      }),
      header: cva("flex w-full flex-col gap-2 "),
      title: cva(
        "m-0 flex items-center justify-between gap-4 text-5xl font-light leading-tight text-inherit"
      ),
      text: cva("text-base-700 m-0 text-lg font-light leading-7"),
      content: cva("flex w-full flex-1 flex-col gap-6"),
      footer: cva("order-last w-full max-w-xs items-start sm:sticky sm:top-40"),
    },

    items: {
      root: cva("!gap-16 ", {
        variants: {
          isDisabled: {
            true: "pointer-events-none",
          },
        },
      }),
      header: cva("flex w-full flex-col gap-2"),
      content: cva("flex w-full flex-col gap-4"),
      footer: cva("flex w-full justify-end gap-2 empty:hidden"),
      // ---
      title: cva(
        "m-0 flex items-center justify-between gap-4 text-5xl font-light leading-tight text-inherit"
      ),
      text: cva("text-base-700 m-0 text-lg font-light leading-7"),
    },

    item: {
      root: cva("", {}),
    },

    paymentDetails: {
      root: cva(""),
      render: cva(""),
    },

    paymentGateway: {
      root: cva("flex flex-col gap-6 py-6 "),
      wrapper: cva("flex flex-col items-center justify-center gap-6", {
        variants: {
          variant: {
            outlined: "rounded-lg border p-6 ",
            flat: "",
          },
        },
        compoundVariants: [
          // {
          //   variant: "outlined",
          //   hasErrors: false,
          //   class:
          //     "focus-within:border-control-active focus-within:ring-control-active focus-within:ring-4 focus-within:ring-opacity-20",
          // },
          {
            variant: "outlined",
            hasErrors: true,
            class:
              "border-control-error focus-within:ring-control-error focus-within:ring-4 focus-within:ring-opacity-20",
          },
        ],
        defaultVariants: {
          variant: "flat",
        },
      }),
      render: cva("w-full empty:hidden", {}),
      form: cva("w-full", {}),
      instructions: cva("m-0 w-full p-0"),
      transition: {
        enter: {
          active: cva("m-0 transition duration-300 ease-out"),
          from: cva("-translate-y-10 transform opacity-0"),
          to: cva("translate-y-0 transform opacity-100"),
        },

        leave: {
          active: cva("absolute transition duration-100 ease-in"),
          from: cva("translate-y-0 transform opacity-100"),
          to: cva("-translate-y-1 transform opacity-0"),
        },
      },
    },

    loading: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-col flex-wrap items-center justify-center gap-6 py-16"
      ),
      title: cva("m-0 text-center text-3xl font-light text-inherit"),
      text: cva(
        "text-base-500  m-0 text-center text-sm leading-5 tracking-tight"
      ),
      avatar: cva("bg-primary text-primary-content border-error size-20 p-2"),
    },

    processing: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-col flex-wrap flex-wrap items-start items-center justify-start justify-center px-6 py-16",
        {
          variants: {},
        }
      ),
      title: cva("m-0 mt-8 text-center text-3xl font-light text-inherit"),
      text: cva("text-base-500 m-0 mt-2 text-center text-sm tracking-tight"),
      avatar: cva("bg-primary text-primary-content size-20 p-2"),
      actions: cva("flex w-full justify-center pt-8"),
    },

    empty: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-col flex-wrap flex-wrap items-start items-center justify-start justify-center gap-6 py-16"
      ),
      title: cva("m-0 text-center text-3xl font-light text-inherit"),
      text: cva(
        "text-base-500  m-0 text-center text-sm leading-5 tracking-tight"
      ),
      avatar: cva("bg-primary text-primary-content size-20 p-2"),
    },
  },
};
