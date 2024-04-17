import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  input: {
    root: cva("flex-1 bg-transparent leading-normal outline-none", {
      variants: {
        size: {
          sm: "px-3 py-2 text-sm ",
          md: "px-3 py-3",
          lg: "px-3 py-4 text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    button: cva("leading-tight text-current underline", {
      variants: {
        size: {
          sm: "px-3 text-xs",
          md: "px-3 text-xs",
          lg: "px-3 text-xs",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
};
