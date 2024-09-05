import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  icon: {
    root: cva("inline-flex flex-shrink-0 align-middle", {
      variants: {
        size: {
          full: "h-full w-full",
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
