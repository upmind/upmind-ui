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
      header: cva(""),
      items: cva(""),
      loading: cva(""),
    },
    card: {
      root: cva(""),
      underline: cva("underline underline-offset-8"),
      label: cva("m-0 flex w-full flex-col gap-1 pr-4"),
      badges: cva("flex items-center gap-2"),
      title: cva("m-0 text-xl font-normal tracking-wide"),
      text: cva(
        "items-cnter text-base-700 m-0  inline-flex gap-2 text-xs font-normal leading-5"
      ),

      // ---
      footer: cva(
        "text-base-700 m-0 flex w-full items-center justify-end gap-10 text-right text-xs font-normal leading-5"
      ),
      actions: cva("min-w-48 empty:hidden"),
      owned: {
        root: cva("m-0 items-end"),
        ownership: cva("font-semibold"),
        icon: cva(
          "bg-accent text-accent-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("not-italic"),
        discount: cva("text-base-500 text-md block font-normal line-through"),
        tld: cva("uppercase not-italic"),
        action: cva(""),
      },
      basket: {
        root: cva("m-0 items-end"),
        ownership: cva("font-semibold"),
        tld: cva("uppercase not-italic"),
        icon: cva(
          "bg-accent text-accent-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("not-italic"),
        discount: cva("text-base-500 text-md block font-normal line-through"),
        action: cva(""),
      },
      available: {
        root: cva("m-0 items-end"),
        ownership: cva("font-medium"),
        tld: cva("uppercase not-italic"),
        icon: cva(
          "bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("m-0 text-lg font-semibold not-italic tracking-wide"),
        discount: cva("text-base-500 block text-xs font-normal line-through"),
        action: cva(""),
      },
      transfer: {
        root: cva("m-0 items-end"),
        ownership: cva("font-normal"),
        tld: cva("uppercase not-italic"),
        icon: cva(
          "bg-secondary text-secondary-foreground inline-flex size-5 items-center justify-center rounded-full p-0.5"
        ),
        prices: cva("inline-block"),
        price: cva("not-italic"),
        discount: cva("text-xs font-normal line-through"),
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
    drawer: {
      root: cva(""),
      header: cva(""),
      content: cva(""),
      footer: cva("flex-row items-center justify-between gap-x-4"),
    },

    transitions: {
      fade: {
        enter: {
          active: cva("duration-300 ease-out"),
          from: cva("transform opacity-0"),
          to: cva("opacity-100"),
        },
        leave: {
          active: cva("hidden duration-200 ease-in"),
          from: cva("opacity-100"),
          to: cva("transform opacity-0"),
        },
      },
    },
  },
};
