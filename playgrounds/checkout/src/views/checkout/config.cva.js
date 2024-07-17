import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkout: {
    root: cva(" flex-col !gap-0 bg-cover bg-no-repeat", {
      variants: {
        isLoading: {
          true: "bg-[url('/background.svg')] ",
        },
        isEmpty: {
          true: "bg-[url('/background.svg')]",
        },
      },
    }),

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
  },
};
