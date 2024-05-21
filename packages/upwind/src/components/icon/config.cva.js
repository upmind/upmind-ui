import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  icon: {
    root: cva("flex flex-shrink-0", {
      variants: {
        size: {
          auto: "",
          sm: "size-6",
          md: "size-8",
          lg: "size-12",
        },
      },
      defaultVariants: {
        size: "none",
      },
    }),
  },
};
