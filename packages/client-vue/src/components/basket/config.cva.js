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
      tooltip: cva("m-0 text-xs hidden group-hover:block leading-tight"),

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
      root: cva(
        "relative flex grid min-h-[70vh] w-full grid-cols-5 items-start justify-start gap-8 py-20",
        {
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
        }
      ),
      header: cva("w-full col-span-3 flex flex-col gap-2 "),
      title: cva(
        "m-0 flex w-full items-center justify-between gap-4 text-5xl font-light leading-tight  text-inherit"
      ),
      content: cva("col-span-3"),
      summary: cva("col-span-2 row-span-3 items-start sm:sticky sm:top-40"),
      footer: cva("w-full"),
    },
  },
};
