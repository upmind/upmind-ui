import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  button: {
    root: cva("font-light uppercase", {
      variants: {
        size: {
          default: "h-8 px-8",
          md: "h-8 px-8",
          xs: "h-4 rounded px-4",
          sm: "h-6 rounded-md px-6",
          lg: "h-16 rounded-md px-16",
          icon: "h-10 w-10",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
};
