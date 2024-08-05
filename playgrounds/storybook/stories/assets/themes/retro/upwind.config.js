import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  button: {
    label: cva("font-light uppercase"),
    root: cva("rounded-none font-light uppercase", {
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
  form: {
    loading: cva("invisible scale-0 transform opacity-0"),
  },
};
