// ---  external
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const interstitialVariants = cva();

// -----------------------------------------------------------------------------
export default {
  interstitial: {
    root: cva(
      "text-display relative flex w-full flex-col flex-wrap items-center justify-center gap-6 px-4 text-center md:px-24",
      {
        variants: {
          isModal: {
            false: "py-16 md:py-18",
            true: "py-12"
          }
        }
      }
    ),

    title: cva("font-display m-0 text-center text-4xl"),
    text: cva(
      "text-muted m-0 max-w-md text-center text-lg leading-normal text-balance"
    ),
    section: cva("flex flex-col items-center gap-3"),
    description: cva("max-w-md text-center text-lg leading-normal"),
    avatar: cva("bg-primary text-primary-foreground size-20 p-2"),
    actions: cva("flex w-full justify-center gap-2")
  }
};
