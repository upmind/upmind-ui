import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  button: {
    label: cva("font-light uppercase"),
    root: cva("", {
      variants: {
        size: {
          sm: "px-2 py-1 text-xs",
          md: "px-2 py-1 text-sm",
          lg: "px-2 py-1 text-base",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    content: cva("", {
      variants: {
        size: {
          sm: "px-1",
          medium: "px-3",
          lg: "px-5",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
  },
  // form: {
  //   content: {
  //     loading: "scale-0 transform invisible opacity-0",
  //   },
  //   actions: {
  //     loading: "invisible opacity-0",
  //   },
  // },
};
