import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  domains: {
    root: cva(
      "flex-col !gap-0 bg-[url('/background.svg')] bg-cover bg-no-repeat"
    ),

    section: {
      root: cva(
        "relative mx-auto flex flex w-full max-w-screen-2xl flex-wrap flex-wrap items-start justify-start gap-6 py-20"
      ),
      // ---
      header: cva("flex w-full flex-col gap-2 "),
      wrapper: cva(
        "relative flex flex w-full flex-wrap items-start justify-start gap-x-6 py-16"
      ),
      content: cva("flex w-full flex-1 flex-col gap-16"),
      sidebar: cva(
        "order-last w-full items-start sm:sticky sm:top-40 md:max-w-xs"
      ),
      footer: cva("flex w-full gap-2"),
      // ---
      title: cva(
        "m-0 flex w-full items-center justify-between gap-4 text-5xl font-light leading-tight  text-inherit"
      ),
      text: cva("m-0 text-lg font-light leading-7 text-base-700"),
    },

    transition: {
      enter: {
        active: cva("m-0 transition duration-300 ease-out"),
        from: cva("translate-y-10 transform opacity-0"),
        to: cva("translate-y-0 transform opacity-100"),
      },

      leave: {
        active: cva("absolute transition duration-100 ease-in"),
        from: cva("translate-y-0 transform opacity-100"),
        to: cva("translate-y-10 transform opacity-0"),
      },
    },
  },
};
