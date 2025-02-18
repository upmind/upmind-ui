import { Interstitial } from "@upmind-automation/upmind-ui";
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  order: {
    interstitial: {
      root: cva(
        "relative flex w-full flex-col flex-wrap items-center justify-center gap-1 px-4 py-16 md:px-8"
      ),
      title: cva("m-0 mt-3 text-center text-3xl text-inherit"),
      text: cva(
        "text-emphasis-medium m-0 mb-8 max-w-md text-center text-lg leading-normal"
      ),
      content: cva(""),
      avatar: cva("bg-primary text-primary-foreground size-20 p-2"),
      actions: cva("flex w-full justify-center"),
    },
  },
};
