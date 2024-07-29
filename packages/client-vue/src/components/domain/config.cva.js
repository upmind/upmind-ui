import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  domain: {
    root: cva("flex flex-col gap-6"),
    choices: cva(""),
    search: cva(""),
    // ---
    listings: {
      root: cva(""),
    },
    card: {
      root: cva(""),
      available: cva("text-primary size-5 "),
      unavailable: cva("text-secondary size-5"),
      underline: cva("underline underline-offset-8"),
      label: cva("m-0 flex w-full flex-col pr-4"),
      title: cva("m-0 text-xl font-medium leading-normal tracking-wide"),
      text: cva(
        "items-cnter text-base-700 m-0 inline inline-flex gap-2 text-xs font-normal leading-5"
      ),
      price: cva(
        "m-0 self-center text-center text-2xl font-semibold tracking-wide"
      ),
      discount: cva("text-base-500 text-md block font-normal line-through"),
      button: cva("self-center"),
      // ---
      footer: cva(
        "text-base-700 m-0 flex w-full w-full items-center justify-end gap-10 text-right text-xs font-normal leading-5"
      ),
      content: cva("inline-flex items-end gap-1"),
      actions: cva("min-w-48"),
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
