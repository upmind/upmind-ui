import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  domain: {
    root: cva("flex w-full flex-col gap-6"),
    choices: cva(""),
    // ---

    search: cva(""),

    listings: {
      root: cva(""),
    },
    card: {
      root: cva(""),
      underline: cva("underline underline-offset-8"),
      label: cva("m-0 flex w-full flex-col pr-4"),
      title: cva("m-0 text-xl font-medium leading-normal tracking-wide"),
      text: cva(
        "items-cnter text-base-700 m-0 inline inline-flex gap-2 text-xs font-normal leading-5"
      ),

      // ---
      footer: cva(
        "text-base-700 m-0 flex w-full w-full items-center justify-end gap-10 text-right text-xs font-normal leading-5"
      ),
      actions: cva("min-w-48"),
      transfer: {
        root: cva("m-0 items-end"),
        ownership: cva("font-medium"),
        price: cva("not-italic"),
        tld: cva("uppercase not-italic"),
        label: cva("text-secondary size-5"),
        discount: cva("text-base-500 text-md block font-normal line-through"),
        action: cva(""),
      },
      available: {
        root: cva("m-0 items-end"),
        ownership: cva("font-medium"),
        price: cva("m-0 text-xl font-semibold not-italic tracking-wide"),
        tld: cva("uppercase not-italic"),
        label: cva("text-primary size-5 "),
        discount: cva("text-base-500 text-md block font-normal line-through"),
        action: cva(""),
      },
    },
    empty: {
      root: cva(
        "bg-base-100 flex flex-col items-center justify-center gap-4 rounded-lg p-4"
      ),
      title: cva("m-0 text-inherit"),
      text: cva("text-base-700 m-0 text-center"),
      icon: cva("text-base-700 size-8"),
    },
  },
};
