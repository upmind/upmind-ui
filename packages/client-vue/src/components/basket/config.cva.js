import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  currencySwitcher: {},

  basket: {
    root: cva(),

    summary: {
      root: cva("w-full flex flex-col gap-8 text-left"),
      header: cva(""),
      title: cva("text-lg font-medium m-0 text-xl tracking-tight"),
      content: cva(
        "grid space-y-4 rounded-lg border border-base-300 shadow-md p-6 bg-base text-base-content "
      ),
      list: cva(
        "grid grid-cols-3 gap-0 border-t border-base-300 first:pt-0 first:border-t-0 pt-4 text-sm m-0"
      ),
      heading: cva(
        "font-light m-0 flex gap-2 items-center flex-1 col-span-2 group"
      ),
      text: cva(
        "text-left m-0 text-sm inline-flex items-start gap-2 leading-tight"
      ),
      value: cva("text-right m-0 flex-0"),
      icon: cva("size-5 flex-0 leading-6"),
      tooltipIcon: cva("size-4 flex-0 leading-6"),
      tooltip: cva("m-0 text-xs hidden group-hover:block leading-tight"),

      footer: cva("font-light grid grid-cols-2 gap-2"),
      actions: cva("col-span-2 mb-4"),
    },

    coupons: {
      root: cva(),
      header: cva(),
      title: cva("text-lg font-medium"),
      content: cva(),
      footer: cva(),
    },
  },
};
