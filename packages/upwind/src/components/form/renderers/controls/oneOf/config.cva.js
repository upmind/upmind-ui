import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  select: {
    root: cva("flex-1 bg-transparent leading-normal outline-none", {
      variants: {
        size: {
          sm: "px-3 py-2 text-sm ",
          md: "px-3 py-3",
          lg: "px-3 py-4 text-lg",
        },
      },
      defaultVariants: {
        size: "md",
      },
    }),
    option: cva(""),
  },
  // ---------------------------------------------------------------------------
  radio: {
    root: cva("", {
      variants: {
        isValid: {
          true: "focus:border-success focus:ring-success",
        },
        isInvalid: {
          true: "border-error-300 focus:!border-error focus:!ring-error focus:!ring-opacity-20",
        },
      },
    }),
  },
  radiolist: {
    root: cva(
      "rounded-btn bg-base-100 m-0 flex w-full flex-1 list-none flex-col gap-4 bg-transparent p-0 leading-normal outline-none",
      {
        variants: {
          size: {
            sm: "px-3 py-2 text-sm ",
            md: "px-3 py-3",
            lg: "px-3 py-4 text-lg",
          },
        },
        defaultVariants: {
          size: "md",
        },
      }
    ),
    title: cva("m-0 p-0"),
    option: cva("m-0 p-0"),
  },
};
