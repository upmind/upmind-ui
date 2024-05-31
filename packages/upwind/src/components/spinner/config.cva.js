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
            auto: "border-[0.1em]",
            xs: "size-6 border-[0.1em]",
            sm: "size-8 border-[0.1em]",
            md: "size-10 border-[0.2em]",
            lg: "size-12 border-[0.4em]",
            xl: "size-14 border-[0.6em]",
            "2xl": "size-16 border-[0.8em]",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
};
