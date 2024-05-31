import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  icon: {
    root: cva("flex flex-shrink-0", {
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
    }),
  },
};
