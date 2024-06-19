import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  textarea: {
    root: cva(
      "flex-1 resize-none bg-transparent leading-normal outline-none", //placeholder:absolute placeholder:top-1/2 placeholder:-translate-y-1/2 placeholder:transform
      {
        variants: {
          size: {
            sm: "px-3 py-2 text-sm leading-5",
            md: "px-3 py-3 leading-6",
            lg: "px-3 py-4 text-lg leading-7",
          },
          isDisabled: {
            true: "bg-base-100 cursor-not-allowed",
          },
          isProcessing: {
            true: "cursor-wait",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
};
