import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  textbox: {
    root: cva(
      "flex-1 resize-none bg-transparent leading-normal outline-none", //placeholder:absolute placeholder:top-1/2 placeholder:-translate-y-1/2 placeholder:transform
      {
        variants: {
          size: {
            sm: "px-3 py-2 text-sm leading-5 placeholder:text-sm",
            md: "text-md placeholder:text-md px-3 py-3 leading-6",
            lg: "px-3 py-4 text-lg leading-7 placeholder:text-lg",
          },
          isDisabled: {
            true: "cursor-not-allowed bg-base-100",
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
    button: cva("leading-tight text-current underline", {
      variants: {
        size: {
          sm: "px-3 py-2 text-xs leading-5",
          md: "px-3 py-3 text-xs leading-6",
          lg: "px-3 py-4 text-xs leading-7",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
};
