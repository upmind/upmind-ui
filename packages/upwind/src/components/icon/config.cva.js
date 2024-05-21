import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  icon: {
    root: cva("flex flex-shrink-0", {
      variants: {
        size: {
          auto: "",
          sm: "size-5",
          md: "size-6",
          lg: "size-7",
        },
      },
      defaultVariants: {
        size: "none",
      },
    }),
  },
};
