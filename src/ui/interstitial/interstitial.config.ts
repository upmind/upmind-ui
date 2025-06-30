// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const interstitialVariants = cva();

// -----------------------------------------------------------------------------
export default {
  interstitial: {
    root: cva(
      "relative flex w-full flex-col flex-wrap items-center justify-center gap-1 px-4 py-12 md:px-8"
    ),

    title: cva("m-0 mt-3 text-center text-3xl text-inherit"),
    text: cva("m-0 max-w-md text-center text-lg leading-normal opacity-50"),
    content: cva("mt-4 max-w-md text-center text-lg leading-normal"),
    avatar: cva("size-20 bg-primary p-2 text-primary-foreground"),
    actions: cva("mt-8 flex w-full justify-center gap-2")
  }
};
