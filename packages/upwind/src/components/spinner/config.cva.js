import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

export default {
  spinner: {
    root: cva(
      "inline-block animate-spin rounded-[100%] border-current border-t-transparent text-current",
      {
        variants: {
          size: {
            sm: "size-4 border-[0.1em]",
            md: "size-6 border-[0.2em]",
            lg: "size-8 border-[0.4em]",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
};
