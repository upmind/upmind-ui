import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  checkout: {
    root: cva(""),
    backButton: cva("relative -top-4"),
    section: cva(
      "relative mx-auto flex w-full flex-wrap items-start justify-start gap-6"
    ),
    container: cva(
      "relative flex w-full flex-wrap items-start justify-start gap-8"
    ),
    mainContent: cva("flex w-full flex-1 flex-col gap-8"),
    aside: cva(
      "order-last flex w-full flex-col items-start gap-6 sm:sticky sm:top-1 xl:max-w-md"
    ),
    asideInner: cva("flex w-full flex-col gap-6 text-left"),
    session: cva("w-full min-w-full"),
    paymentDetails: cva("!p-0"),
  },
};
