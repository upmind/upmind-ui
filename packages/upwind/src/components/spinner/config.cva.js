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
            square: "size-4 border-[0.2em]",
            badge: "size-3 border-[0.2em]",
            xs: "size-4 border-[0.2em]",
            sm: "size-6 border-[0.2em]",
            md: "size-10 border-[0.2em]",
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
