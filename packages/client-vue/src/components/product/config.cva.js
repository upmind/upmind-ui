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

      header: cva("w-full flex items-end gap-10"),
      headerContent: cva("w-full flex flex-wrap items-start gap-2 "),

      content: cva("w-full flex-none flex flex-wrap gap-6 empty:hidden "),

      footer: cva(
        "border-t border-base-300 px-6 py-4 flex w-full items-center justify-between gap-6"
      ),
      // ---
      title: cva("w-full m-0 text-4xl font-normal leading-none tracking-wide"),
      meta: cva(
        "w-full flex gap-4 items-center text-left lowercase m-0 text-sm leading-snug text-base-700"
      ),
      text: cva("w-full text-left m-0 leading-normal text-base-700"),
      bold: cva("font-medium "),
      total: cva("font-medium text-2xl leading-snug tracking-wide"),
      discount: cva(
        "font-normal text-md leading-snug tracking-wide line-through text-base-700"
      ),
      // ---
      image: cva("h-full w-full object-cover"),
      actions: cva("flex gap-2 items-center"),
      summary: cva("inline-flex items-center gap-6"),
    },
  },
};
