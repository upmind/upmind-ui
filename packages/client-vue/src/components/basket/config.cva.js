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
        "text-left m-0 text-sm inline-flex items-end gap-2 leading-normal font-normal text-base-700"
      ),
      bold: cva("font-medium text-base-content"),
      discount: cva("font-light text-xs line-through text-base-500 block"),
      value: cva("text-right m-0 flex-0 text-base-content font-medium block "),
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
        root: cva("flex-row gap-1"),
        actions: cva("items-start w-auto"),
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
            true: "pointer-events-none",
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
          "bg-accent text-accent-content border border-accent rounded-lg gap-0"
        ),
        header: cva(
          "flex items-center gap-2 px-6 py-1 text-center justify-center text-sm"
        ),
        content: cva("flex flex-col rounded-lg"),
        item: cva("rounded-none border-b-0 last:rounded-b-lg"),
        footer: cva("empty:hidden flex gap-2 justify-end p-4"),
      },
    },

    paymentDetails: {
      root: cva(""),
      render: cva(""),
    },

    paymentGateway: {
      root: cva("flex flex-col gap-6 py-6 "),
      wrapper: cva(
        "empty:hidden flex gap-6 flex-col p-6 rounded-lg border border-base-300 justify-center items-center"
      ),
      render: cva("empty:hidden w-full"),
      form: cva("w-full"),
      transition: {
        enter: {
          active: cva("m-0 transition duration-300 ease-out"),
          from: cva("-translate-y-10 transform opacity-0"),
          to: cva("translate-y-0 transform opacity-100"),
        },

        leave: {
          active: cva("transition duration-100 ease-in absolute"),
          from: cva("translate-y-0 transform opacity-100"),
          to: cva("-translate-y-1 transform opacity-0"),
        },
      },
    },

    loading: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-wrap flex-wrap items-start justify-start gap-6 py-16 flex-col justify-center items-center"
      ),
      title: cva("text-3xl font-light m-0 text-center text-inherit"),
      text: cva(
        "text-sm  leading-5 tracking-tight text-center m-0 text-base-500"
      ),
      avatar: cva("size-20 bg-primary text-primary-content p-2 border-error"),
    },

    processing: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-wrap flex-wrap items-start justify-start py-16 px-6 flex-col justify-center items-center",
        {
          variants: {},
        }
      ),
      title: cva("text-3xl font-light m-0 mt-8 text-center text-inherit"),
      text: cva("text-sm tracking-tight text-center m-0 mt-2 text-base-500"),
      avatar: cva("size-20 bg-primary text-primary-content p-2"),
      actions: cva("flex w-full justify-center pt-8"),
    },

    empty: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-wrap flex-wrap items-start justify-start gap-6 py-16 flex-col justify-center items-center"
      ),
      title: cva("text-3xl font-light m-0 text-center text-inherit"),
      text: cva(
        "text-sm  leading-5 tracking-tight text-center m-0 text-base-500"
      ),
      avatar: cva("size-20 bg-primary text-primary-content p-2"),
    },
  },
};
