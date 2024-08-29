import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  icon: {
    root: cva(
      "inline-flex flex-shrink-0 align-middle [&>svg]:h-full [&>svg]:w-full",
      {
        variants: {
          size: {
            xs: "size-6",
            sm: "size-8",
            md: "size-10",
            lg: "size-12",
            xl: "size-14",
            "2xl": "size-16",
          },
        },
        defaultVariants: {
          size: "none",
        },
      }
    ),
  },
};
