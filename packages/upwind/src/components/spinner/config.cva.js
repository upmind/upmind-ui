import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

export default {
  spinner: {
    root: cva(
      "inline-block flex-shrink-0 animate-spin rounded-[100%] border-[0.1em] border-current !border-t-transparent text-current",
      {
        variants: {
          size: {
            auto: "",
            xs: "size-6",
            sm: "size-8",
            md: "size-10",
            lg: "size-12 border-[0.2em]",
            xl: "size-14 border-[0.4em]",
            "2xl": "size-16 border-[0.6em]",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
  },
};
